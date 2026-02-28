import { NextResponse } from "next/server";
import { GOOGLE_FONTS } from "@/lib/fonts";
import { generateTextWithGemini } from "@/lib/gemini-provider";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );

        const body = await req.json();
        const { businessName, niche, description } = body;

        if (!niche || !description) {
            return NextResponse.json(
                { error: "Faltan datos del proyecto" },
                { status: 400 }
            );
        }

        const availableFontsList = GOOGLE_FONTS.map((f) => f.name).join(", ");

        const systemPrompt = `Actúa como un director de arte experto en branding y diseño visual.
Necesito que elijas la MEJOR tipografía (una sola) de esta lista exacta disponible, basándote en el ADN de esta marca:
Lista de tipografías permitidas: ${availableFontsList}

Nombre de Empresa: ${businessName || "No definido"}
Nicho: ${niche}
Descripción: ${description}

Reglas:
1. Debes elegir UNA SOLA del catálogo permitido. Ni una más, ni inventadas.
2. Tu respuesta DEBE SER EXCLUSIVAMENTE el nombre exacto de la tipografía elegida (ej. "Inter" o "Playfair Display"). No incluyas puntuación ni explicaciones adicionales, sólo el nombre de la tipografía.`;

        const suggestedFont = await generateTextWithGemini({
            userId,
            systemPrompt,
            userPrompt:
                "Dame la tipografía sugerida basándote en el contexto dado.",
        });

        const trimmedFont = suggestedFont.trim();

        // Validate that the suggestion is actually in our list
        const isValid = GOOGLE_FONTS.some(
            (f) => f.name.toLowerCase() === trimmedFont.toLowerCase()
        );

        return NextResponse.json({
            suggestedFont: isValid ? trimmedFont : "Inter",
        });
    } catch (error: any) {
        console.error("AI Font Suggestion Error:", error);
        return NextResponse.json(
            {
                error: "Error al generar sugerencia de tipografía",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
