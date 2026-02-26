import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado. Inicia sesión primero." }, { status: 401 });
        }

        const body = await req.json();
        const { geminiKey } = body;

        if (!geminiKey) {
            return NextResponse.json({ error: "Falta la API Key." }, { status: 400 });
        }

        // Use service role key to bypass RLS, because the user might not have permissions to UPSERT yet.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceRole) {
            return NextResponse.json({ error: "Configuración de Supabase incompleta en el servidor." }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRole);

        // Upsert the API key into the api_keys table
        const { error } = await supabase
            .from('api_keys')
            .upsert({
                user_id: userId,
                gemini_key: geminiKey,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error("Supabase upsert error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error saving API Key:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
