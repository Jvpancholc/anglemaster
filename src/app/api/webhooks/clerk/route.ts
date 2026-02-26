import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Use service_role key to bypass RLS when inserting new users
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('Missing CLERK_WEBHOOK_SECRET');
        return new Response('Error: Missing CLERK_WEBHOOK_SECRET', { status: 400 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400,
        });
    }

    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';

        try {
            // Insert user into Supabase. Needs a 'users' table in public schema.
            const { error } = await supabase.from('users').upsert({
                id: id,
                email: email,
                first_name: first_name,
                last_name: last_name,
                avatar_url: image_url,
                // You can add default plan here if your table supports it
            });

            if (error) {
                console.error("Error upserting user to Supabase:", error);
                // We return 200 anyway so Clerk stops retrying unless it's a critical DB fault we want to retry
            } else {
                console.log(`User ${id} successfully synced to Supabase.`);
            }
        } catch (e) {
            console.error("Webhook DB processing error:", e);
        }
    }

    return new Response('Webhook received', { status: 200 });
}
