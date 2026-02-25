import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase. We need the service role key to bypass RLS and upload to storage from backend if necessary,
// or just standard anon key if bucket is public, but let's assume we have what we need.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || "mock-token",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, angleId, numVariants, context } = body;

        if (!context) {
            return NextResponse.json({ error: "Missing context data" }, { status: 400 });
        }

        const {
            creativeFormats,
            visualStyle,
            identity,
            analysis,
            angleText
        } = context;

        // Construct the prompt based on user instructions
        const formatsString = creativeFormats && creativeFormats.length > 0
            ? creativeFormats.join(" and ")
            : "standard advertisement";

        const prompt = `
      Style: ${visualStyle || "Realistic"}, highly detailed, professional quality.
      Format: ${formatsString} layout.
      Brand Colors: Primary ${identity?.primaryColor || "#000000"}, Secondary ${identity?.secondaryColor || "#FFFFFF"}.
      Product: ${analysis?.product || "generic product"}.
      Sales Angle/Concept: ${angleText || "buy this product"}.
      Instruction: Generate a high-quality Facebook Ads image that perfectly encapsulates these elements, focused on conversion and clear visual hierarchy.
    `.trim().replace(/\s+/g, ' ');

        console.log("Constructed Prompt for Replicate:", prompt);

        // If Replicate token is missing or mock, we will just return mock data to avoid crashing
        if (!process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN === "mock-token") {
            console.log("No REPLICATE_API_TOKEN found, simulating response...");
            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockImages = Array.from({ length: numVariants }).map((_, i) =>
                `https://picsum.photos/seed/${crypto.randomUUID()}/400/600`
            );

            return NextResponse.json({
                success: true,
                images: mockImages,
                promptUsed: prompt,
                message: "Simulated response (Token missing)"
            });
        }

        // Call Replicate
        // Use stability-ai/stable-diffusion or stability-ai/sdxl
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    num_outputs: parseInt(numVariants) || 1,
                    scheduler: "K_EULER",
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    width: 768,
                    height: 1024, // good format for ads/stories
                }
            }
        ) as string[];

        console.log("Replicate output:", output);

        // Output from stability-ai is usually an array of image URLs
        const uploadedUrls: string[] = [];

        // Optional: Download images from Replicate and upload to Supabase Storage
        // For now, we will just return the URLs provided by Replicate, as they are hosted temporarily,
        // but the prompt asked to upload them. Let's do the upload if Supabase is properly configured.

        if (supabaseUrl && supabaseServiceKey && output && output.length > 0) {
            for (let i = 0; i < output.length; i++) {
                const imageUrl = output[i];
                try {
                    // Fetch image buffer
                    const imageRes = await fetch(imageUrl);
                    const imageBlob = await imageRes.blob();

                    const fileName = `${projectId}/${angleId}/${crypto.randomUUID()}.png`;

                    const { data, error } = await supabase.storage
                        .from("creatives") // Assuming bucket 'creatives' exists
                        .upload(fileName, imageBlob, {
                            contentType: 'image/png',
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (error) {
                        console.error("Error uploading to Supabase:", error);
                        uploadedUrls.push(imageUrl); // fallback to original Replicate URL
                    } else {
                        const { data: publicUrlData } = supabase.storage.from("creatives").getPublicUrl(fileName);
                        uploadedUrls.push(publicUrlData.publicUrl);
                    }
                } catch (uploadError) {
                    console.error("Failed to process and upload image:", uploadError);
                    uploadedUrls.push(imageUrl); // fallback
                }
            }
        } else {
            uploadedUrls.push(...(output || []));
        }

        return NextResponse.json({
            success: true,
            images: uploadedUrls,
            promptUsed: prompt
        });

    } catch (error: any) {
        console.error("Error generating creatives:", error);
        return NextResponse.json({ error: error.message || "Failed to generate creatives" }, { status: 500 });
    }
}
