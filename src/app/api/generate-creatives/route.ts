import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeWithRotation } from "@/lib/provider-rotator";

// Initialize Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, angleId, numVariants, context, settings, userId, supabaseToken, generationModel } = body;

        let supabase: any;
        if (supabaseToken) {
            supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
                global: { headers: { Authorization: `Bearer ${supabaseToken}` } }
            });
        } else {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
        }

        let variantsInt = parseInt(numVariants) || 1;

        let currentGenerations = 100;
        const today = new Date().toISOString().split('T')[0];

        if (userId) {
            let apiKeyData: any, apiKeyError: any;

            const res = await supabase
                .from('api_keys')
                .select('daily_generations, last_generation_date, providers_keys')
                .eq('user_id', userId)
                .single();

            apiKeyData = res.data;
            apiKeyError = res.error;

            if (apiKeyError && apiKeyError.code === 'PGRST204') {
                const fallbackRes = await supabase
                    .from('api_keys')
                    .select('daily_generations, last_generation_date')
                    .eq('user_id', userId)
                    .single();
                apiKeyData = fallbackRes.data;
                apiKeyError = fallbackRes.error;
            }

            // Determine if the user has their own custom keys configured
            const hasOwnKey =
                (apiKeyData?.providers_keys?.replicate?.length > 0) ||
                (apiKeyData?.providers_keys?.huggingface?.length > 0);

            if (!apiKeyError && apiKeyData) {
                if (apiKeyData.last_generation_date !== today) {
                    currentGenerations = 100;
                } else if (apiKeyData.daily_generations !== null) {
                    currentGenerations = apiKeyData.daily_generations;
                    if (currentGenerations <= 0) {
                        currentGenerations = 100; // Force reset for testing/dev
                    }
                }
            }

            // ONLY enforce credit limits if the user is using the platform's global keys
            if (!hasOwnKey && currentGenerations < variantsInt) {
                return NextResponse.json({ error: "Límite diario excedido. Actualiza tu plan o añade claves API configuradas en Preferencias para generación ilimitada." }, { status: 403 });
            }

            // ONLY deduct credits if using global keys
            if (!hasOwnKey) {
                const { error: updateError } = await supabase
                    .from('api_keys')
                    .upsert({
                        user_id: userId,
                        daily_generations: currentGenerations - variantsInt,
                        last_generation_date: today
                    }, { onConflict: 'user_id' });

                if (updateError) {
                    console.error("Error al actualizar límite diario:", updateError);
                }
            }
        }

        if (!context) {
            return NextResponse.json({ error: "Missing context data" }, { status: 400 });
        }

        const {
            creativeFormats,
            visualStyle,
            identity,
            analysis,
            angleText
        } = context;

        const { freeStyle } = body;

        // Construct the prompt based on user instructions
        const formatsString = creativeFormats && creativeFormats.length > 0
            ? creativeFormats.join(" and ")
            : "standard advertisement";

        const fontInstruction = identity?.typography && identity.typography !== "auto"
            ? `Typography style: ${identity.typography}.`
            : "";

        const sloganInstruction = identity?.includeSlogan && identity?.slogan
            ? `Include exact text: "${identity.slogan}".`
            : "";

        const brandColorsInstruction = freeStyle
            ? "Use an extravagant, creative, and unrestrained color palette that defies standard conventions (DO NOT restrict to brand colors)."
            : `Brand Colors: Primary ${identity?.primaryColor || "#000000"}, Secondary ${identity?.secondaryColor || "#FFFFFF"}.`;

        const styleInstruction = freeStyle
            ? "Style: Highly creative, out-of-the-box, extravagant, visually striking."
            : `Style: ${visualStyle || "Realistic"}, highly detailed, professional quality.`;

        const prompt = `
      ${styleInstruction}
      Format: ${formatsString} layout.
      ${brandColorsInstruction}
      ${!freeStyle ? fontInstruction : ""}
      ${sloganInstruction}
      Product: ${analysis?.product || "generic product"}.
      Sales Angle/Concept: ${angleText || "buy this product"}.
      Instruction: Generate a high-quality Facebook Ads image that perfectly encapsulates these elements, focused on conversion and clear visual hierarchy.
    `.trim().replace(/\s+/g, ' ');

        console.log("Constructed Final Prompt for Rotation:", prompt);

        // CREATE IMAGES VIA ROTATOR
        const rotatedResults = await executeWithRotation({
            userId,
            supabaseToken,
            taskType: "image",
            imagePrompt: prompt,
            numVariants: variantsInt
        });

        // PENDING RECORDS IN DATABASE
        const generatedUrls = rotatedResults.flatMap(r => r.urls || (r.url ? [r.url] : []));

        // PENDING RECORDS IN DATABASE
        const newCreatives = generatedUrls.map((url) => ({
            project_id: projectId,
            user_id: userId || 'anonymous',
            angle_id: angleId,
            prompt: prompt,
            image_url: url,
            metadata: {
                status: "completed",
                createdAt: new Date().toISOString(),
                provider: rotatedResults[0].provider
            }
        }));

        const { data: insertedCreatives, error: insertError } = await supabase
            .from('creatives')
            .insert(newCreatives)
            .select('id');

        if (insertError || !insertedCreatives) {
            console.error("Error creating creatives:", insertError);
            return NextResponse.json({ error: "Failed to create mock creatives" }, { status: 500 });
        }

        // Return FAST synchronous response
        return NextResponse.json({
            success: true,
            images: generatedUrls,
            message: "Generación exitosa."
        });

    } catch (error: any) {
        console.error("Error in generate-creatives:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
