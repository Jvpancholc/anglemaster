import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateImageWithGemini } from "@/lib/gemini-provider";
import { checkRateLimit } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            projectId,
            angleId,
            numVariants,
            context,
            settings,
            userId,
            supabaseToken,
            freeStyle,
            userImage,        // base64 optional — client reference photo
            userImageMime,    // mime type for the user image
            generationFormat, // "1:1" | "4:5" | "9:16" | "16:9"
        } = body;

        // ── Rate limiting ──────────────────────────────────────────────
        if (userId) {
            const rateLimitResult = checkRateLimit(
                `gen-creatives:${userId}`,
                { maxRequests: 10, windowMs: 60_000 }
            );
            if (!rateLimitResult.allowed) {
                return NextResponse.json(
                    {
                        error: `Límite de solicitudes excedido. Intenta de nuevo en ${Math.ceil(rateLimitResult.resetIn / 1000)} segundos.`,
                    },
                    { status: 429 }
                );
            }
        }

        // ── Supabase client ────────────────────────────────────────────
        let supabase: any;
        if (supabaseToken) {
            supabase = createClient(
                supabaseUrl,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${supabaseToken}`,
                        },
                    },
                }
            );
        } else {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
        }

        const variantsInt = parseInt(numVariants) || 1;

        // ── Daily generation limits ────────────────────────────────────
        const today = new Date().toISOString().split("T")[0];
        let currentGenerations = 100;

        if (userId) {
            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from("api_keys")
                .select("daily_generations, last_generation_date")
                .eq("user_id", userId)
                .single();

            if (!apiKeyError && apiKeyData) {
                if (apiKeyData.last_generation_date !== today) {
                    currentGenerations = 100;
                } else if (apiKeyData.daily_generations !== null) {
                    currentGenerations = apiKeyData.daily_generations;
                    if (currentGenerations <= 0) currentGenerations = 100;
                }
            }

            if (currentGenerations < variantsInt) {
                return NextResponse.json(
                    {
                        error: "Límite diario excedido. Actualiza tu plan o intenta mañana.",
                    },
                    { status: 403 }
                );
            }

            // Deduct credits
            await supabase.from("api_keys").upsert(
                {
                    user_id: userId,
                    daily_generations: currentGenerations - variantsInt,
                    last_generation_date: today,
                },
                { onConflict: "user_id" }
            );
        }

        if (!context) {
            return NextResponse.json(
                { error: "Missing context data" },
                { status: 400 }
            );
        }

        // ── Build prompt ───────────────────────────────────────────────
        const { creativeFormats, visualStyle, identity, analysis, angleText } =
            context;

        const formatsString =
            creativeFormats && creativeFormats.length > 0
                ? creativeFormats.join(" and ")
                : "standard advertisement";

        const fontInstruction =
            identity?.typography && identity.typography !== "auto"
                ? `Typography style: ${identity.typography}.`
                : "";

        const sloganInstruction =
            identity?.includeSlogan && identity?.slogan
                ? `Include exact text: "${identity.slogan}".`
                : "";

        const brandColorsInstruction = freeStyle
            ? "Use an extravagant, creative, and unrestrained color palette."
            : `Brand Colors: Primary ${identity?.primaryColor || "#000000"}, Secondary ${identity?.secondaryColor || "#FFFFFF"}.`;

        const styleInstruction = freeStyle
            ? "Style: Highly creative, out-of-the-box, extravagant, visually striking."
            : `Style: ${visualStyle || "Realistic"}, highly detailed, professional quality.`;

        const prompt = [
            styleInstruction,
            `Format: ${formatsString} layout.`,
            brandColorsInstruction,
            !freeStyle ? fontInstruction : "",
            sloganInstruction,
            `Product: ${analysis?.product || "generic product"}.`,
            `Sales Angle/Concept: ${angleText || "buy this product"}.`,
            "Generate a high-quality Facebook Ads image that perfectly encapsulates these elements, focused on conversion and clear visual hierarchy.",
        ]
            .filter(Boolean)
            .join(" ")
            .trim()
            .replace(/\s+/g, " ");

        console.log("[generate-creatives] Prompt:", prompt);

        // ── Generate with Gemini ───────────────────────────────────────
        const results = await generateImageWithGemini({
            prompt,
            imageBase64: userImage || undefined,
            imageMimeType: userImageMime || undefined,
            aspectRatio: generationFormat || "4:5",
            numVariants: variantsInt,
            userId: userId || "anonymous",
            branding: identity
                ? {
                    primaryColor: identity.primaryColor,
                    secondaryColor: identity.secondaryColor,
                    typography: identity.typography,
                    slogan: identity.slogan,
                    includeSlogan: identity.includeSlogan,
                }
                : undefined,
            visualStyle: visualStyle || undefined,
        });

        const generatedUrls = results.map((r) => r.publicUrl);

        // ── Save metadata to DB ────────────────────────────────────────
        const newCreatives = generatedUrls.map((url) => ({
            project_id: projectId,
            user_id: userId || "anonymous",
            angle_id: angleId,
            prompt,
            image_url: url,
            metadata: {
                status: "completed",
                createdAt: new Date().toISOString(),
                provider: "gemini",
                aspectRatio: generationFormat || "4:5",
            },
        }));

        const { error: insertError } = await supabase
            .from("creatives")
            .insert(newCreatives)
            .select("id");

        if (insertError) {
            console.error("Error inserting creatives:", insertError);
            return NextResponse.json(
                { error: "Error al guardar los creativos en la base de datos." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            images: generatedUrls,
            provider: "gemini",
            message: "Generación exitosa con Google Gemini.",
        });
    } catch (error: any) {
        console.error("[generate-creatives] Error:", error);
        return NextResponse.json(
            { error: error.message || "Error al generar creativos" },
            { status: 500 }
        );
    }
}
