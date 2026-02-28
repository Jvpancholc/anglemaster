import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Tables to clean up for this user
        const tables = ['creatives', 'angles', 'analysis', 'brand_identity', 'projects', 'api_keys'];
        const errors: string[] = [];

        // Delete creatives' storage files first
        const { data: creatives } = await supabase
            .from('creatives')
            .select('image_url')
            .eq('user_id', userId);

        if (creatives && creatives.length > 0) {
            for (const creative of creatives) {
                if (creative.image_url && creative.image_url.includes('supabase.co')) {
                    try {
                        const pathParts = creative.image_url.split('/public/');
                        if (pathParts.length > 1) {
                            const bucketAndPath = pathParts[1].split('/');
                            const bucket = bucketAndPath[0];
                            const filePath = bucketAndPath.slice(1).join('/');
                            await supabase.storage.from(bucket).remove([filePath]);
                        }
                    } catch (e) {
                        // Continue even if storage delete fails
                    }
                }
            }
        }

        // Delete from each table
        for (const table of tables) {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userId);

            if (error) {
                errors.push(`${table}: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Algunos datos no pudieron eliminarse",
                errors
            }, { status: 207 });
        }

        return NextResponse.json({
            success: true,
            message: "Todos tus datos han sido eliminados permanentemente."
        });

    } catch (error: any) {
        console.error("Error in delete-account:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
