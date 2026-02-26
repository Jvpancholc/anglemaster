import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import { Client as QStashClient } from "@upstash/qstash";

// Initialize Supabase. We need the service role key to bypass RLS and upload to storage from backend if necessary,
// or just standard anon key if bucket is public, but let's assume we have what we need.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, angleId, numVariants, context, settings, userId } = body;

        let variantsInt = parseInt(numVariants) || 1;

        let apiKey = settings?.replicateKey || process.env.REPLICATE_API_TOKEN || "mock-token";
        const isUsingPersonalKey = !!settings?.replicateKey;

        if (userId && !isUsingPersonalKey) {
            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from('api_keys')
                .select('daily_generations, last_generation_date')
                .eq('user_id', userId)
                .single();

            let currentGenerations = 40;
            const today = new Date().toISOString().split('T')[0];

            if (!apiKeyError && apiKeyData) {
                // Si la última fecha de generación no fue hoy, resetear a 40
                if (apiKeyData.last_generation_date !== today) {
                    currentGenerations = 40;
                } else if (apiKeyData.daily_generations !== null) {
                    currentGenerations = apiKeyData.daily_generations;
                }
            }

            if (currentGenerations < variantsInt) {
                return NextResponse.json({ error: "Límite diario de prueba excedido. Actualiza tu plan o añade tu propia API Key en Preferencias." }, { status: 403 });
            }

            // Deduct credits and update date
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



        const replicate = new Replicate({
            auth: apiKey,
        });

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

        console.log("Constructed Prompt for Replicate:", prompt);


        console.log("Constructed Prompt for Replicate:", prompt);

        // CREATE PENDING RECORDS IN DATABASE
        const newCreatives = Array.from({ length: variantsInt }).map(() => ({
            project_id: projectId,
            user_id: userId || 'anonymous',
            angle_id: angleId,
            prompt: prompt,
            image_url: "pending", // Satisface el constraint NOT NULL temporalmente
            metadata: { status: "pending", createdAt: new Date().toISOString() }
        }));

        const { data: insertedCreatives, error: insertError } = await supabase
            .from('creatives')
            .insert(newCreatives)
            .select('id');

        if (insertError || !insertedCreatives) {
            console.error("Error creating pending creatives:", insertError);
            return NextResponse.json({ error: "Failed to initialize generation queue" }, { status: 500 });
        }

        const creativeIds = insertedCreatives.map(c => c.id);

        const payload = {
            creativeIds,
            prompt,
            replicateKey: apiKey
        };

        const targetUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/generate`
            : `http://localhost:3000/api/webhooks/generate`;

        // DISPATCH TO QSTASH OR LOCAL FALLBACK
        if (process.env.QSTASH_TOKEN) {
            console.log(`Dispatching ${creativeIds.length} jobs to QStash...`);
            const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN });
            await qstash.publishJSON({
                url: targetUrl,
                body: payload
            });
        } else {
            console.log(`No QSTASH_TOKEN. Dispatching local background fetch to ${targetUrl}...`);
            // Fire and forget (Next.js config might kill this on Vercel, but local works)
            fetch(targetUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(e => console.error("Local fallback background fetch failed:", e));
        }

        return NextResponse.json({
            success: true,
            queued: true,
            message: "Generación encolada exitosamente",
            creativeIds: creativeIds
        });

    } catch (error: any) {
        console.error("Error in generate-creatives:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
