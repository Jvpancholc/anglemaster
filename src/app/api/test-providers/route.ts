import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { geminiKey } = body;

        if (!geminiKey || !geminiKey.trim()) {
            return NextResponse.json(
                { error: "No se proporcionó una clave de Gemini para probar." },
                { status: 400 }
            );
        }

        const results: Record<string, { valid: boolean; error?: string }> = {};

        // Test the Gemini key
        try {
            const { GoogleGenerativeAI } = await import(
                "@google/generative-ai"
            );
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
            });
            await model.generateContent("Responde solo OK");
            results.gemini = { valid: true };
        } catch (e: any) {
            results.gemini = {
                valid: false,
                error: e.message || "Clave inválida",
            };
        }

        return NextResponse.json({
            success: true,
            allValid: results.gemini?.valid === true,
            results,
        });
    } catch (error: any) {
        console.error("Error testing provider:", error);
        return NextResponse.json(
            { error: error.message || "Error interno" },
            { status: 500 }
        );
    }
}
