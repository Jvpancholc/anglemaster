import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteImageFromS3 } from "@/lib/s3";
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Esto asegura que la función corra hasta 60s en Edge/Hobby (máximo permitido)
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
    // Basic Security for Vercel Cron
    // Check if the request comes from Vercel's Cron scheduler
    const authHeader = req.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Iniciando tarea de limpieza de imágenes antiguas (7 días)...");

        // 1. Calcular la fecha límite (7 días atrás)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thresholdDate = sevenDaysAgo.toISOString();

        // 2. Buscar registros viejos
        const { data: oldCreatives, error: searchError } = await supabase
            .from('creatives')
            .select('id, image_url')
            .lt('created_at', thresholdDate);

        if (searchError) {
            throw searchError;
        }

        if (!oldCreatives || oldCreatives.length === 0) {
            console.log("[CRON] No hay imágenes antiguas por eliminar.");
            return NextResponse.json({ success: true, message: "No old creatives found." });
        }

        console.log(`[CRON] Encontrados ${oldCreatives.length} registros para eliminar.`);

        let deletedCount = 0;
        let failedCount = 0;

        // 3. Iterar y eliminar el archivo físico y luego el registro BD
        for (const creative of oldCreatives) {
            const { id, image_url } = creative;

            if (image_url) {
                // Check if it's an S3 url
                if (image_url.includes('s3') && image_url.includes('amazonaws.com') && process.env.AWS_BUCKET_NAME) {
                    const deleted = await deleteImageFromS3(image_url);
                    if (!deleted) {
                        console.error(`[CRON] S3 Delete falló para ID: ${id}. Eliminaremos la row de BD de todas formas.`);
                        failedCount++;
                    }
                }
                // Check if it's a Supabase storage url 
                else if (image_url.includes('supabase.co')) {
                    // Extract bucket and path info. Example: https://xxx.supabase.co/storage/v1/object/public/creatives/foo.png
                    try {
                        const pathParts = image_url.split('/public/');
                        if (pathParts.length > 1) {
                            const bucketAndPath = pathParts[1].split('/');
                            const bucket = bucketAndPath[0];
                            const filePath = bucketAndPath.slice(1).join('/');

                            const { error: storageErr } = await supabase.storage.from(bucket).remove([filePath]);
                            if (storageErr) throw storageErr;
                        }
                    } catch (e) {
                        console.error(`[CRON] ERROR eliminando de Supabase Storage para ID ${id}:`, e);
                    }
                }
            }

            // Eliminar de base de datos
            const { error: dbDeleteError } = await supabase
                .from('creatives')
                .delete()
                .eq('id', id);

            if (dbDeleteError) {
                console.error(`[CRON] DB Delete falló para ID: ${id}`, dbDeleteError);
                failedCount++;
            } else {
                deletedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup finished. Deleted: ${deletedCount}, Failed: ${failedCount}`,
            deletedCount,
            failedCount
        });

    } catch (error: any) {
        console.error("[CRON] Error crítico durante cleanup:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
