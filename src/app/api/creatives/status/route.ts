import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const idsString = searchParams.get('ids');

    if (!idsString) {
        return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    const ids = idsString.split(',').map(id => id.trim()).filter(Boolean);

    try {
        const { data, error } = await supabase
            .from('creatives')
            .select('id, image_url, metadata')
            .in('id', ids);

        if (error) {
            console.error("Error fetching creatives status:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return status dictionary
        const statusMap = ids.reduce((acc, id) => {
            const creative = data?.find(c => c.id === id);

            if (!creative) {
                acc[id] = { status: 'unknown', url: null };
            } else {
                // Si image_url existe y no es temporal (o si status metadata es completed), está listo
                const isCompleted = creative.metadata?.status === 'completed' || !!creative.image_url;
                acc[id] = {
                    status: isCompleted ? 'completed' : 'pending',
                    url: isCompleted ? creative.image_url : null
                };
            }
            return acc;
        }, {} as Record<string, { status: string, url: string | null }>);

        return NextResponse.json({ success: true, statuses: statusMap });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
