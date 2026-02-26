import { createClient } from "@supabase/supabase-js";

interface ProviderRotatorOptions {
    userId: string;
    taskType: "text" | "image";
    supabaseToken?: string;
    systemPrompt?: string;
    userPrompt?: string;
    // Image specific options
    imagePrompt?: string;
    aspectRatio?: string;
    numVariants?: number;
}

interface ProviderResponse {
    provider: string;
    url?: string;
    text?: string;
    success: boolean;
    error?: string;
}

// In an ideal world we test locally or through real endpoint. 
// For now, this service will be imported by Next.js Backend API routes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function executeWithRotation(options: ProviderRotatorOptions): Promise<ProviderResponse[]> {
    let supabase: any;
    if (options.supabaseToken) {
        supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            global: { headers: { Authorization: `Bearer ${options.supabaseToken}` } }
        });
    } else {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 1. Fetch User Keys & Limits from DB
    const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('daily_generations, last_generation_date, providers_keys')
        .eq('user_id', options.userId)
        .single();

    if (apiKeyError && apiKeyError.code !== 'PGRST116') {
        throw new Error("Error fetching API keys for rotation: " + apiKeyError.message);
    }

    // Extract user keys or fallback to globals
    const userKeys = apiKeyData?.providers_keys || { gemini: [], groq: [], replicate: [], huggingface: [] };

    // Merge with global keys from ENV as fallback if needed, or stick solely to user ones. 
    // Usually, BYOK limits global cost. But we can inject globals here if user keys are empty.
    let activeGeminiKeys = [...(userKeys.gemini || [])];
    if (activeGeminiKeys.length === 0 && process.env.GEMINI_API_KEY) {
        activeGeminiKeys.push(process.env.GEMINI_API_KEY);
    }

    let activeGroqKeys = [...(userKeys.groq || [])];
    if (activeGroqKeys.length === 0 && process.env.GROQ_API_KEY) {
        activeGroqKeys.push(process.env.GROQ_API_KEY);
    }

    let activeReplicateKeys = [...(userKeys.replicate || [])];
    if (activeReplicateKeys.length === 0 && process.env.REPLICATE_API_TOKEN) {
        activeReplicateKeys.push(process.env.REPLICATE_API_TOKEN);
    }

    // 2. Define priority routing based on TaskType
    let providerPriorityOrder: { id: string; keys: string[] }[] = [];

    if (options.taskType === "image") {
        // Image generation Priority: 1. Replicate (Stable Diffusion), 2. HuggingFace (if implemented later)
        providerPriorityOrder = [
            { id: "replicate", keys: activeReplicateKeys },
            // Add fallback to others if image gen is supported
        ];
    } else if (options.taskType === "text") {
        // Text generation Priority: 1. Groq (Fastest), 2. Gemini
        providerPriorityOrder = [
            { id: "groq", keys: activeGroqKeys },
            { id: "gemini", keys: activeGeminiKeys },
        ];
    }

    // 3. Attempt Execution
    for (const provider of providerPriorityOrder) {
        if (provider.keys.length === 0) continue;

        for (const key of provider.keys) {
            try {
                // Execute the actual AI call based on provider ID
                const result = await executeSpecificProvider(provider.id, key, options);

                if (result.success) {
                    return [result]; // Immediate success return
                }
            } catch (err: any) {
                console.error(`Provider [${provider.id}] with key failed:`, err.message || err);
                // On 429 logic, we just continue through the loop to the next Key or Provider.
                // You could implement exponential backoff here.
            }
        }
    }

    throw new Error("All configured AI providers and keys reached their limits or failed. Please add more keys in Preferencias.");
}

async function executeSpecificProvider(providerId: string, apiKey: string, options: ProviderRotatorOptions): Promise<ProviderResponse> {
    if (providerId === "gemini") {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const fullPrompt = `${options.systemPrompt || ""}\n\n${options.userPrompt || ""}`;
        const result = await model.generateContent(fullPrompt);
        return { provider: "gemini", success: true, text: result.response.text() };

    } else if (providerId === "groq") {
        const fetchRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: options.systemPrompt || "Eres un experto." },
                    { role: "user", content: options.userPrompt || "Responde cortamente." }
                ]
            })
        });

        if (!fetchRes.ok) throw new Error("Groq Error: " + fetchRes.statusText);
        const data = await fetchRes.json();
        return { provider: "groq", success: true, text: data.choices[0].message.content };

    } else if (providerId === "replicate") {
        const Replicate = (await import("replicate")).default;
        const replicate = new Replicate({ auth: apiKey });

        const prompt = options.imagePrompt || "beautiful scenery";
        const output: any = await replicate.run(
            "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
            {
                input: {
                    prompt: prompt,
                    num_outputs: options.numVariants || 1
                }
            }
        );

        // Assume output is an array of URLs
        const urls = Array.isArray(output) ? output : [output];
        return { provider: "replicate", success: true, url: urls[0] }; // Modificado posteriormente en el endpoint principal si requiere arrays completos.
    }

    throw new Error(`Provider ${providerId} not supported for direct internal rotary call yet`);
}
