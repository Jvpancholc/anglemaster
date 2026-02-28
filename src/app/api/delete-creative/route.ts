import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { deleteImageFromS3 } from "@/lib/s3";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { creativeId } = body;

        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!creativeId) {
            return NextResponse.json({ error: "ID de creativo requerido" }, { status: 400 });
        }

        // Use service role key to bypass RLS — ownership is verified manually below
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch the creative to ensure ownership and get the storage path
        const { data: creative, error: fetchError } = await supabase
            .from('creatives')
            .select('user_id, image_url')
            .eq('id', creativeId)
            .single();

        if (fetchError || !creative) {
            console.error("fetchError in delete:", fetchError);
            return NextResponse.json({ error: "No se encontró el creativo (" + (fetchError?.message || 'Not Found') + ")" }, { status: 404 });
        }

        if (creative.user_id !== userId) {
            return NextResponse.json({ error: "No tienes permiso para eliminar este creativo" }, { status: 403 });
        }

        // 2. Delete from storage if it's hosted in our buckets (S3/Supabase)
        // Only if it's not a generic picsum URL or pending placeholder
        if (creative.image_url && !creative.image_url.includes('picsum.photos') && !creative.image_url.includes('pending')) {
            try {
                if (creative.image_url.includes('amazonaws.com')) {
                    await deleteImageFromS3(creative.image_url);
                } else {
                    // Extract filename from URL - assumes standard Supabase storage URL format
                    // e.g., https://[project].supabase.co/storage/v1/object/public/creatives/[filename]
                    const urlParts = creative.image_url.split('/');
                    const filename = urlParts[urlParts.length - 1];

                    // Also check if bucket name is explicitly passed or try 'creatives' / 'logos'
                    const { error: storageError } = await supabase
                        .storage
                        .from('creatives')
                        .remove([filename]);

                    if (storageError) {
                        console.error("Storage delete warning (might not exist in bucket):", storageError);
                    }
                }
            } catch (e) {
                console.error("Failed to parse/delete from storage:", e);
            }
        }

        // 3. Delete from Database
        const { error: deleteError } = await supabase
            .from('creatives')
            .delete()
            .eq('id', creativeId);

        if (deleteError) {
            console.error("Error deleting from DB:", deleteError);
            return NextResponse.json({ error: "Error al eliminar de la base de datos" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Creativo eliminado exitosamente" });

    } catch (error: any) {
        console.error("Error en delete-creative:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
