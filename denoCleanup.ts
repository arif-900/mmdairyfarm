import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import "jsr:@std/dotenv/load";

async function main() {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
        console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env setup or run inside Supabase Edge Runtime.");
        Deno.exit(1);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    console.log("Fetching all auth users...");
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
        console.error("Auth Error:", authError);
        Deno.exit(1);
    }

    console.log("Fetching all public profiles...");
    const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('user_id');
    if (profileError) {
        console.error("Profile Error:", profileError);
        Deno.exit(1);
    }

    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const orphanedUsers = users.filter(u => !profileUserIds.has(u.id));

    console.log(`Found ${orphanedUsers.length} orphaned/half-created users.`);

    for (const user of orphanedUsers) {
        console.log(`Deleting orphan: ${user.email}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError);
        } else {
            console.log(`Successfully deleted ${user.email}`);
        }
    }
    console.log("Cleanup finished.");
}

main();
