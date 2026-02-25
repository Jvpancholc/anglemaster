import { NextResponse } from "next/server";
import { GOOGLE_FONTS } from "@/lib/fonts";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { businessName, niche, description } = body;

        if (!niche || !description) {
            return NextResponse.json({ error: "Faltan datos del proyecto" }, { status: 400 });
        }

        const availableFontsList = GOOGLE_FONTS.map(f => f.name).join(", ");

        const prompt = `Actúa como un director de arte experto en branding y diseño visual.
Necesito que elijas la MEJOR tipografía (una sola) de esta lista exacta disponible, basándote en el ADN de esta marca:
Lista de tipografías permitidas: ${availableFontsList}

Nombre de Empresa: ${businessName || "No definido"}
Nicho: ${niche}
Descripción: ${description}

Reglas:
1. Debes elegir UNA SOLA PALA del catálogo permitido. Ni una más, ni inventadas.
2. Tu respuesta DEBE SER EXCLUSIVAMENTE el nombre exacto de la tipografía elegida (ej. "Inter" o "Playfair Display"). No incluyas puntuación ni explicaciones adicionales, sólo el nombre de la tipografía.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
            temperature: 0.7,
            max_tokens: 15, // We just need the font name
        });

        const suggestedFont = completion.choices[0].message.content?.trim() || "Inter"; // Fallback to Inter

        // Validate that the suggestion is actually in our list, otherwise fallback
        const isValid = GOOGLE_FONTS.some(f => f.name.toLowerCase() === suggestedFont.toLowerCase());

        return NextResponse.json({
            suggestedFont: isValid ? suggestedFont : "Inter"
        });

    } catch (error: any) {
        console.error("AI Font Suggestion Error:", error);
        return NextResponse.json(
            { error: "Error al generar sugerencia de tipografía", details: error.message },
            { status: 500 }
        );
    }
}
