import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: Request) {
    try {
        const { brandName, industry, style, description } = await req.json();

        const replicateApiToken = process.env.REPLICATE_API_TOKEN;

        if (!replicateApiToken) {
            console.warn("REPLICATE_API_TOKEN not found. Returning mock logos.");

            // Fallback a imágenes de Unsplash si no hay token (Simulando)
            return NextResponse.json({
                urls: [
                    "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1516876437184-593fda40c7ce?q=80&w=400&auto=format&fit=crop",
                ]
            });
        }

        const replicate = new Replicate({
            auth: replicateApiToken,
        });

        const prompt = `
      A professional logo design for a brand named "${brandName}". 
      Industry: ${industry}. 
      Style: ${style} logo. 
      Details: ${description}. 
      Vector art, flat design, clean lines, high quality, suitable for branding, typography and icon. White background.
    `.trim().replace(/\s+/g, ' ');

        console.log("Generating Logo with prompt:", prompt);

        // Call Replicate for logo generation
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    num_outputs: 3,
                    scheduler: "K_EULER",
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    width: 768,
                    height: 768,
                }
            }
        ) as string[];

        return NextResponse.json({ urls: output });

    } catch (error: any) {
        console.error("Generate Logo API Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
