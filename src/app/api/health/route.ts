import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const checks: Record<string, { status: string; error?: string }> = {};

    // 1. Check Supabase
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            checks.supabase = { status: "error", error: "Missing env vars" };
        } else {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase
                .from("projects")
                .select("id")
                .limit(1);
            checks.supabase = error
                ? { status: "degraded", error: error.message }
                : { status: "healthy" };
        }
    } catch (e: any) {
        checks.supabase = { status: "error", error: e.message };
    }

    // 2. Check Gemini API key
    checks.gemini = process.env.GEMINI_API_KEY
        ? { status: "configured" }
        : { status: "not_configured" };

    const overallHealthy = checks.supabase?.status === "healthy";

    return NextResponse.json(
        {
            status: overallHealthy ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            checks,
        },
        { status: overallHealthy ? 200 : 503 }
    );
}
