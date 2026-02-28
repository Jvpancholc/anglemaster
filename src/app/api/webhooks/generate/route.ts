import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateImageWithGemini } from "@/lib/gemini-provider";

// Allow longer execution for async webhook processing
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { creativeIds, prompt, userId } = payload;

        if (!creativeIds || !prompt) {
            return NextResponse.json(
                { error: "Missing required payload" },
                { status: 400 }
            );
        }

        console.log(
            `[Worker] Generating ${creativeIds.length} images with Gemini...`
        );

        // Generate all images with Gemini
        const results = await generateImageWithGemini({
            prompt,
            numVariants: creativeIds.length,
            userId: userId || "anonymous",
            aspectRatio: "4:5",
        });

        // Update each creative in DB with the public URL
        for (let i = 0; i < creativeIds.length; i++) {
            const creativeId = creativeIds[i];
            const result = results[i];

            if (!result) {
                console.error(
                    `[Worker] No result for creative ${creativeId}`
                );
                continue;
            }

            const { error: updateError } = await supabase
                .from("creatives")
                .update({
                    image_url: result.publicUrl,
                    metadata: {
                        status: "completed",
                        prompt,
                        provider: "gemini",
                    },
                })
                .eq("id", creativeId);

            if (updateError) {
                console.error(`[Worker] DB Update error:`, updateError);
            }
        }

        return NextResponse.json({
            success: true,
            processed: creativeIds.length,
        });
    } catch (error: any) {
        console.error("[Worker] Failed to process webhook:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
