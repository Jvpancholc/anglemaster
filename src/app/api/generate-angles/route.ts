import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeWithRotation } from "@/lib/provider-rotator";

// Placeholder endpoint for /api/generate-angles
// Ready to be connected to OpenAI later.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { projectId, analysis, settings, userId } = body;

        if (!userId) {
            const authObj = await auth();
            userId = authObj.userId;
        }

        const outputLanguage = settings?.language || 'Español';

        console.log(`Generating Angles in ${outputLanguage}...`);

        const systemPrompt = `You are a world-class expert copywriter and marketing strategist specializing in direct response and Facebook Ads. You MUST respond exactly in the requested language: ${outputLanguage}. Your only task is to return exactly 10 distinct, highly persuasive marketing angles based on the product analysis provided. Return them as a simple numbered list from 1 to 10. Do not include introductory text.`;

        const userPrompt = `Product: ${analysis.product}
Avatar (Target Audience): ${analysis.avatar}
Unique Mechanism: ${analysis.ums}
Big Promise: ${analysis.promise}

Generate exactly 10 short, punchy, persuasive marketing angles (one sentence each) that I can use in Facebook video ads.`;

        // Execute via Rotator
        const rotatedResults = await executeWithRotation({
            userId,
            taskType: "text",
            systemPrompt,
            userPrompt
        });

        const generatedText = rotatedResults[0].text || "";

        // Parse the returned text into an array of angles.
        // Expecting a numbered list like "1. Angle 1\n2. Angle 2"
        let parsedAngles = generatedText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^\d+\./)) // only keep lines starting with "Number."
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^【.*?】\s*:\s*/, '').replace(/^\[.*?\]\s*:\s*/, '').trim())
            .filter(Boolean);

        // Fallback safety if the regex failed to parse exactly 10
        if (parsedAngles.length === 0) {
            console.warn("AI didn't return a numbered list properly. Returning raw split lines.");
            parsedAngles = generatedText.split('\n').map(l => l.trim()).filter(l => l.length > 10).slice(0, 10);
        }

        return NextResponse.json({
            success: true,
            angles: parsedAngles
        });

    } catch (error: any) {
        console.error("Error generating angles:", error);
        return NextResponse.json({ error: error.message || "Failed to generate angles" }, { status: 500 });
    }
}
