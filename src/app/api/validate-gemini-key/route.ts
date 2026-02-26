import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { geminiKey } = body;

        if (!geminiKey || geminiKey.trim() === "") {
            return NextResponse.json({ error: "La API Key está vacía." }, { status: 400 });
        }

        // Test the API key by initializing the Gemini client and generating a simple response
        const genAI = new GoogleGenerativeAI(geminiKey);

        // Use a lightweight model for a quick check
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // A very simple ping prompt
        const prompt = "Reply with exactly the word 'OK' and nothing else.";

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().toUpperCase() === "OK") {
            return NextResponse.json({ success: true, message: "Validación exitosa" });
        } else {
            // Unexpected response, but API auth might still be OK
            return NextResponse.json({ success: true, message: "Validación exitosa pero respuesta inesperada" });
        }

    } catch (error: any) {
        console.error("Gemini Validation Error:", error);

        let userMessage = "La clave API de Gemini no parece válida.";

        // Try to catch specific Google API errors if possible
        if (error.status === 403 || error.status === 401 || (error.message && error.message.includes("API key not valid"))) {
            userMessage = "La clave proporcionada no es válida o no tiene permisos.";
        } else if (error.status === 400) {
            userMessage = "Mala petición a Google. ¿Es correcta la sintaxis de tu llave?";
        } else if (error.status === 429) {
            userMessage = "Has excedido el límite de cuota (Rate Limit) de tu llave en Google AI Studio.";
        }

        return NextResponse.json({ error: userMessage, details: error.message }, { status: 400 });
    }
}
