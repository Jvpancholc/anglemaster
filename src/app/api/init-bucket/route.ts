import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // VERY IMPORTANT: We try to use the SERVICE_ROLE string if available, otherwise fallback and hope for the best
        // Generally creating buckets requires either service_role or specific RLS policies setup
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Supabase config missing" }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error("List buckets error:", listError);
            return NextResponse.json({ error: listError.message }, { status: 500 });
        }

        const hasLogosBucket = buckets.some(b => b.name === 'logos');

        if (!hasLogosBucket) {
            console.log("Bucket 'logos' not found, attempting to create...");
            const { error: createError } = await supabase.storage.createBucket('logos', {
                public: true,
                fileSizeLimit: 2097152, // 2MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
            });

            if (createError) {
                console.error("Create bucket error:", createError);
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }
            console.log("Bucket 'logos' created successfully!");
        } else {
            // Double check it's public (Admin API doesn't let us easily toggle this without updating bucket, but if it exists we assume it's right or we could run updateBucket)
            await supabase.storage.updateBucket('logos', { public: true });
        }

        return NextResponse.json({ success: true, message: "Bucket 'logos' initialized" });

    } catch (error: any) {
        console.error("Init Bucket Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
