import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GOOGLE_FONTS } from "@/lib/fonts";
import { detectFontWithGemini } from "@/lib/gemini-provider";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { description } = await req.json();

        if (!description) {
            return NextResponse.json(
                { error: "Falta la descripción" },
                { status: 400 }
            );
        }

        const fontNamesList = GOOGLE_FONTS.map((f) => f.name).join(", ");

        const recommended = await detectFontWithGemini({
            description,
            fontsList: fontNamesList,
            userId,
        });

        // Validate that recommendations are actually in our list
        const validFonts = recommended.filter((name) =>
            GOOGLE_FONTS.some(
                (f) => f.name.toLowerCase() === name.toLowerCase()
            )
        );

        return NextResponse.json({
            fonts:
                validFonts.length > 0
                    ? validFonts.slice(0, 3)
                    : ["Inter", "Roboto", "Montserrat"],
        });
    } catch (error: any) {
        console.error("Detect Font API Error:", error);
        return NextResponse.json(
            { error: error.message || "Error al detectar fuentes" },
            { status: 500 }
        );
    }
}
