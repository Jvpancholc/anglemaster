import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateLogoWithGemini } from "@/lib/gemini-provider";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { brandName, industry, style, description } = await req.json();

        if (!brandName || !industry) {
            return NextResponse.json(
                { error: "Falta nombre de marca o industria" },
                { status: 400 }
            );
        }

        const urls = await generateLogoWithGemini({
            brandName,
            industry,
            style: style || "modern",
            description: description || "",
            userId,
        });

        return NextResponse.json({ urls });
    } catch (error: any) {
        console.error("Generate Logo API Error:", error);
        return NextResponse.json(
            { error: error.message || "Error al generar logos" },
            { status: 500 }
        );
    }
}
