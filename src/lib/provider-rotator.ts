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
    urls?: string[];
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
    let apiKeyData: any, apiKeyError: any;

    const res = await supabase
        .from('api_keys')
        .select('daily_generations, last_generation_date, providers_keys')
        .eq('user_id', options.userId)
        .single();

    apiKeyData = res.data;
    apiKeyError = res.error;

    if (apiKeyError && apiKeyError.code === 'PGRST204') {
        // Fallback if providers_keys column does not exist
        const fallbackRes = await supabase
            .from('api_keys')
            .select('daily_generations, last_generation_date')
            .eq('user_id', options.userId)
            .single();
        apiKeyData = fallbackRes.data;
        apiKeyError = fallbackRes.error;
    }

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
        // Image generation Priority: 1. Replicate (Stable Diffusion), 2. Pollinations (Free fallback)
        providerPriorityOrder = [
            { id: "replicate", keys: activeReplicateKeys },
            { id: "pollinations", keys: ["free-tier"] } // No key needed, but we pass a dummy string to bypass the length check
        ];
    } else if (options.taskType === "text") {
        // Text generation Priority: 1. Groq (Fastest), 2. Gemini, 3. Pollinations (Free Fallback)
        providerPriorityOrder = [
            { id: "groq", keys: activeGroqKeys },
            { id: "gemini", keys: activeGeminiKeys },
            { id: "pollinations-text", keys: ["free-tier"] }
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
        return { provider: "replicate", success: true, url: urls[0], urls };
    } else if (providerId === "pollinations") {
        const prompt = options.imagePrompt || "beautiful scenery";
        const numVariants = options.numVariants || 1;
        const urls: string[] = [];

        // Pollinations requires query params for customization, especially seed for variants
        for (let i = 0; i < numVariants; i++) {
            const seed = Math.floor(Math.random() * 1000000000);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1080&height=1350&nologo=true`;
            urls.push(url);
        }

        // We don't need to await anything as pollinations URLs generate on the fly when rendered
        return { provider: "pollinations", success: true, url: urls[0], urls };
    } else if (providerId === "pollinations-text") {
        const fullPrompt = `${options.systemPrompt || ""}\n\n${options.userPrompt || ""}`;
        const fetchRes = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: options.systemPrompt || "Eres un experto." },
                    { role: "user", content: options.userPrompt || "Responde cortamente." }
                ],
                model: "openai"
            })
        });

        if (!fetchRes.ok) throw new Error("Pollinations Text Error: " + fetchRes.statusText);
        const text = await fetchRes.text();
        return { provider: "pollinations-text", success: true, text: text };
    }

    throw new Error(`Provider ${providerId} not supported for direct internal rotary call yet`);
}
