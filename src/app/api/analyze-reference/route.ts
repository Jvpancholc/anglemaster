import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const { userId: authUserId } = await auth();
        const body = await req.json();
        const { imageBase64, mimeType, userId: bodyUserId } = body;
        const userId = bodyUserId || authUserId;

        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // Rate limiting
        const rateLimitResult = checkRateLimit(`analyze-ref:${userId}`, { maxRequests: 30, windowMs: 60_000 });
        if (!rateLimitResult.allowed) {
            return NextResponse.json({
                error: `Límite excedido. Intenta en ${Math.ceil(rateLimitResult.resetIn / 1000)}s.`
            }, { status: 429 });
        }

        if (!imageBase64) {
            return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });
        }

        // Use Gemini Vision to analyze the image
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: "GEMINI_API_KEY no configurada. Agrega tu clave en .env.local"
            }, { status: 500 });
        }

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const analysisPrompt = `Analyze this advertisement/marketing image in detail. Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

{
  "title": "A short descriptive title for this ad style (e.g., 'Person Centered with Gradient Overlay', 'Split Screen Before After')",
  "composition": "A detailed 2-3 sentence description of the visual composition, layout, subject positioning, visual hierarchy, and design techniques used.",
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

Rules:
- Title should describe the visual style/composition type, max 6 words
- Composition should explain HOW the ad is structured visually
- Emotions: exactly 3 dominant emotions the ad evokes (in Spanish)
- Palette: exactly 5 hex colors extracted from the dominant colors in the image
- Respond in Spanish for emotions, English for title and composition`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: analysisPrompt },
                        {
                            inlineData: {
                                mimeType: mimeType || "image/jpeg",
                                data: imageBase64,
                            },
                        },
                    ],
                },
            ],
        });

        const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse JSON from response (handle potential markdown wrapping)
        let analysis;
        try {
            const jsonStr = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            analysis = JSON.parse(jsonStr);
        } catch {
            console.error("Failed to parse Gemini response:", rawText);
            // Fallback structure
            analysis = {
                title: "Visual Analysis",
                composition: rawText.substring(0, 300),
                emotions: ["Confianza", "Curiosidad", "Interés"],
                palette: ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"],
            };
        }

        return NextResponse.json({
            success: true,
            analysis: {
                title: analysis.title || "Visual Analysis",
                composition: analysis.composition || "",
                emotions: (analysis.emotions || []).slice(0, 3),
                palette: (analysis.palette || []).slice(0, 5),
            },
        });

    } catch (error: any) {
        console.error("Error analyzing reference:", error);
        return NextResponse.json({ error: error.message || "Error al analizar imagen" }, { status: 500 });
    }
}
