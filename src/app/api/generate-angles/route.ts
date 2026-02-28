import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateTextWithGemini } from "@/lib/gemini-provider";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { analysis, settings, userId } = body;

        if (!userId) {
            const authObj = await auth();
            userId = authObj.userId;
        }

        // Rate limiting: 10 requests per minute per user
        if (userId) {
            const rateLimitResult = checkRateLimit(
                `gen-angles:${userId}`,
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

        const outputLanguage = settings?.language || "Español";

        console.log(`Generating Angles in ${outputLanguage}...`);

        const systemPrompt = `You are a world-class expert copywriter and marketing strategist specializing in direct response and Facebook Ads. You MUST respond exactly in the requested language: ${outputLanguage}. Your only task is to return exactly 10 distinct, highly persuasive marketing angles based on the product analysis provided. Return them as a simple numbered list from 1 to 10. Do not include introductory text.`;

        const userPrompt = `Product: ${analysis.product}
Avatar (Target Audience): ${analysis.avatar}
Unique Mechanism: ${analysis.ums}
Big Promise: ${analysis.promise}

Generate exactly 10 short, punchy, persuasive marketing angles (one sentence each) that I can use in Facebook video ads.`;

        // Generate with Gemini
        const generatedText = await generateTextWithGemini({
            userId,
            systemPrompt,
            userPrompt,
        });

        // Parse the returned text into an array of angles.
        let parsedAngles = generatedText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.match(/^\d+\./))
            .map((line) =>
                line
                    .replace(/^\d+\.\s*/, "")
                    .replace(/^【.*?】\s*:\s*/, "")
                    .replace(/^\[.*?\]\s*:\s*/, "")
                    .trim()
            )
            .filter(Boolean);

        if (parsedAngles.length === 0) {
            console.warn("AI didn't return a numbered list properly.");
            parsedAngles = generatedText
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 10)
                .slice(0, 10);
        }

        return NextResponse.json({
            success: true,
            angles: parsedAngles,
        });
    } catch (error: any) {
        console.error("Error generating angles:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate angles" },
            { status: 500 }
        );
    }
}
