import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Gemini Provider — Único proveedor de IA para AngleMaster
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface GeminiImageOptions {
    prompt: string;
    imageBase64?: string;         // Optional client reference photo
    imageMimeType?: string;       // Mime type of the reference photo
    aspectRatio?: string;         // "1:1" | "4:5" | "9:16" | "16:9"
    numVariants?: number;
    userId: string;
    branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        typography?: string;
        slogan?: string;
        includeSlogan?: boolean;
    };
    visualStyle?: string;
}

export interface GeminiImageResult {
    base64: string;
    mimeType: string;
    publicUrl: string;
}

export interface GeminiTextOptions {
    systemPrompt: string;
    userPrompt: string;
    userId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch the Gemini API key: first user-specific from DB, then env fallback.
 */
async function getGeminiApiKey(userId?: string): Promise<string> {
    // 1. Try user-specific key from DB
    if (userId) {
        try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data } = await supabase
                .from("api_keys")
                .select("gemini_key, providers_keys")
                .eq("user_id", userId)
                .single();

            const userKey =
                data?.providers_keys?.gemini?.[0] || data?.gemini_key;
            if (userKey && userKey.trim()) return userKey;
        } catch {
            // Fallthrough to env
        }
    }

    // 2. Fallback to server env
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim()) return envKey;

    throw new Error(
        "No se encontró una API Key de Gemini. Configúrala en Preferencias o en las variables del servidor."
    );
}

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 */
async function uploadToStorage(
    base64Data: string,
    mimeType: string,
    userId: string,
    prefix: string = "creatives"
): Promise<string> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const extension = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const fileName = `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = `${prefix}/${userId}/${fileName}`;
    const buffer = Buffer.from(base64Data, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
        .from("creatives")
        .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error("Error al subir la imagen generada al storage.");
    }

    const { data: publicUrlData } = supabaseAdmin.storage
        .from("creatives")
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

// ─── Ultra-realistic prompt builder ──────────────────────────────────────────

const COMMERCIAL_PROMPT_BASE =
    "Ultra realistic commercial advertisement photo, professional marketing campaign, " +
    "cinematic lighting, high contrast shadows, DSLR quality, advertising layout, " +
    "clean typography space, Meta Ads social media style";

function buildCommercialPrompt(
    userPrompt: string,
    options: {
        branding?: GeminiImageOptions["branding"];
        visualStyle?: string;
        aspectRatio?: string;
    }
): string {
    const parts: string[] = [COMMERCIAL_PROMPT_BASE];

    if (options.visualStyle) {
        parts.push(`Visual style: ${options.visualStyle}.`);
    }

    parts.push(userPrompt);

    if (options.branding) {
        const b = options.branding;
        if (b.primaryColor || b.secondaryColor) {
            parts.push(
                `Brand colors: primary ${b.primaryColor || "#000"}, secondary ${b.secondaryColor || "#FFF"}.`
            );
        }
        if (b.typography && b.typography !== "auto") {
            parts.push(`Typography: ${b.typography}.`);
        }
        if (b.includeSlogan && b.slogan) {
            parts.push(`Include text: "${b.slogan}".`);
        }
    }

    if (options.aspectRatio) {
        parts.push(`Aspect ratio: ${options.aspectRatio}.`);
    }

    return parts.join(" ").trim().replace(/\s+/g, " ");
}

// ─── Public Functions ────────────────────────────────────────────────────────

/**
 * Generate image(s) with Gemini, upload to Supabase Storage, return public URLs.
 */
export async function generateImageWithGemini(
    options: GeminiImageOptions
): Promise<GeminiImageResult[]> {
    const apiKey = await getGeminiApiKey(options.userId);
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = buildCommercialPrompt(options.prompt, {
        branding: options.branding,
        visualStyle: options.visualStyle,
        aspectRatio: options.aspectRatio,
    });

    const numVariants = options.numVariants || 1;
    const results: GeminiImageResult[] = [];

    for (let i = 0; i < numVariants; i++) {
        // Build content parts
        const contentParts: any[] = [{ text: fullPrompt }];

        // If a reference user photo is provided, include it
        if (options.imageBase64) {
            contentParts.push({
                inlineData: {
                    mimeType: options.imageMimeType || "image/jpeg",
                    data: options.imageBase64,
                },
            });
            // Append instruction to maintain face/identity
            contentParts[0].text +=
                " Maintain the exact face, identity, and features of the person in the reference photo. " +
                "The person should be the main subject of the advertisement.";
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: contentParts,
            config: {
                responseModalities: ["IMAGE"],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData?.data) {
            throw new Error(
                `Gemini no generó imagen (variante ${i + 1}/${numVariants}). Verifica tu API key y cuota.`
            );
        }

        const base64 = imagePart.inlineData.data as string;
        const mimeType = imagePart.inlineData.mimeType || "image/png";

        // Upload to storage
        const publicUrl = await uploadToStorage(
            base64,
            mimeType,
            options.userId
        );

        results.push({ base64, mimeType, publicUrl });
    }

    return results;
}

/**
 * Generate text with Gemini (for angles, font suggestions, etc.)
 */
export async function generateTextWithGemini(
    options: GeminiTextOptions
): Promise<string> {
    const apiKey = await getGeminiApiKey(options.userId);
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `${options.systemPrompt}\n\n${options.userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

/**
 * Generate a logo with Gemini image generation.
 */
export async function generateLogoWithGemini(opts: {
    brandName: string;
    industry: string;
    style: string;
    description: string;
    userId: string;
}): Promise<string[]> {
    const apiKey = await getGeminiApiKey(opts.userId);
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt =
        `Professional logo design for "${opts.brandName}". ` +
        `Industry: ${opts.industry}. Style: ${opts.style}. ` +
        `Details: ${opts.description}. ` +
        `Vector art, flat design, clean lines, high quality, suitable for branding, typography and icon. White background.`;

    const urls: string[] = [];

    // Generate 3 logo variants
    for (let i = 0; i < 3; i++) {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: prompt,
            config: { responseModalities: ["IMAGE"] },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData?.data) {
            throw new Error(`Gemini no generó logo (variante ${i + 1}/3).`);
        }

        const base64 = imagePart.inlineData.data as string;
        const mimeType = imagePart.inlineData.mimeType || "image/png";

        const publicUrl = await uploadToStorage(
            base64,
            mimeType,
            opts.userId,
            "logos"
        );
        urls.push(publicUrl);
    }

    return urls;
}

/**
 * Detect/suggest fonts using Gemini text generation.
 */
export async function detectFontWithGemini(opts: {
    description: string;
    fontsList: string;
    userId: string;
}): Promise<string[]> {
    const apiKey = await getGeminiApiKey(opts.userId);
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert typography designer. 
I need 3 fonts that perfectly match this brand description: "${opts.description}"

Available fonts: ${opts.fontsList}

ONLY reply with a JSON array of the 3 exact font names from the list above that you recommend. 
Do not include any other text, markdown formatting, or explanation. 
Valid example output: ["Inter", "Playfair Display", "Montserrat"]
`;

    const result = await model.generateContent(prompt);
    const outputString = result.response.text();

    let recommended: string[] = [];
    try {
        const jsonStr = outputString.substring(
            outputString.indexOf("["),
            outputString.lastIndexOf("]") + 1
        );
        recommended = JSON.parse(jsonStr);
    } catch {
        console.warn("Could not parse Gemini font response. Falling back.");
        recommended = ["Inter", "Roboto", "Montserrat"];
    }

    return recommended.slice(0, 3);
}
