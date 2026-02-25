import { NextResponse } from "next/server";
import Replicate from "replicate";
import { GOOGLE_FONTS } from "@/lib/fonts";

export async function POST(req: Request) {
    try {
        const { description } = await req.json();
        const replicateApiToken = process.env.REPLICATE_API_TOKEN;

        if (!replicateApiToken) {
            console.warn("REPLICATE_API_TOKEN not found. Returning mock fonts.");
            // Simulated response based on simple keyword matching
            const desc = description.toLowerCase();
            let matched = GOOGLE_FONTS.filter(f => desc.includes(f.name.toLowerCase()));

            if (matched.length === 0) {
                if (desc.includes("modern") || desc.includes("tech") || desc.includes("minimal")) {
                    matched = GOOGLE_FONTS.filter(f => f.category === "Sans Serif").slice(0, 3);
                } else if (desc.includes("classic") || desc.includes("elegant") || desc.includes("lujo")) {
                    matched = GOOGLE_FONTS.filter(f => f.category === "Serif").slice(0, 3);
                } else if (desc.includes("fun") || desc.includes("kid") || desc.includes("diverti")) {
                    matched = GOOGLE_FONTS.filter(f => f.category === "Display" || f.category === "Handwriting").slice(0, 3);
                } else {
                    matched = GOOGLE_FONTS.slice(0, 3);
                }
            }
            return NextResponse.json({ fonts: matched.map(f => f.name).slice(0, 3) });
        }

        const replicate = new Replicate({ auth: replicateApiToken });
        const fontNamesList = GOOGLE_FONTS.map(f => f.name).join(", ");

        const prompt = `
You are an expert typography designer. 
I need 3 fonts that perfectly match this brand description: "${description}"

Available fonts: ${fontNamesList}

ONLY reply with a JSON array of the 3 exact font names from the list above that you recommend. 
Do not include any other text, markdown formatting, or explanation. 
Valid example output: ["Inter", "Playfair Display", "Montserrat"]
`;

        // Try to get a structured response using Mixtral or Llama
        // Mixtral handles JSON quite well
        const output = await replicate.run(
            "mistralai/mixtral-8x7b-instruct-v0.1",
            {
                input: {
                    prompt: prompt,
                    max_new_tokens: 100,
                    temperature: 0.1, // Low temp for more deterministic array output
                }
            }
        );

        // Output is usually a stream of strings, let's join it
        const outputString = Array.isArray(output) ? output.join("") : String(output);
        console.log("Raw LLM Output for fonts:", outputString);

        // Try to parse the JSON array from the response
        let recommended: string[] = [];
        try {
            const jsonStr = outputString.substring(
                outputString.indexOf("["),
                outputString.lastIndexOf("]") + 1
            );
            recommended = JSON.parse(jsonStr);
        } catch (e) {
            console.warn("Could not parse LLM output as JSON array. Falling back to simple extracting");
            // Fallback: simple exact match from the original list
            recommended = GOOGLE_FONTS
                .map(f => f.name)
                .filter(name => outputString.includes(name))
                .slice(0, 3);
        }

        // If absolutely failed, return top 3
        if (recommended.length === 0) {
            recommended = ["Inter", "Roboto", "Montserrat"];
        }

        return NextResponse.json({ fonts: recommended.slice(0, 3) });

    } catch (error: any) {
        console.error("Detect Font API Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
