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
        const hasProductPhotosBucket = buckets.some(b => b.name === 'product-photos');

        if (!hasLogosBucket) {
            console.log("Bucket 'logos' not found, attempting to create...");
            const { error: createError } = await supabase.storage.createBucket('logos', {
                public: true,
                fileSizeLimit: 2097152, // 2MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
            });

            if (createError) {
                console.error("Create bucket error:", createError);
            } else {
                console.log("Bucket 'logos' created successfully!");
            }
        } else {
            // Double check it's public
            await supabase.storage.updateBucket('logos', { public: true });
        }

        if (!hasProductPhotosBucket) {
            console.log("Bucket 'product-photos' not found, attempting to create...");
            const { error: createError } = await supabase.storage.createBucket('product-photos', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
            });

            if (createError) {
                console.error("Create product-photos bucket error:", createError);
            } else {
                console.log("Bucket 'product-photos' created successfully!");
            }
        } else {
            // Double check it's public
            await supabase.storage.updateBucket('product-photos', { public: true });
        }

        return NextResponse.json({ success: true, message: "Buckets initialized" });

    } catch (error: any) {
        console.error("Init Bucket Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
