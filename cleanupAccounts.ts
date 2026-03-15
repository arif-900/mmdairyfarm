import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need the service role key to delete users

if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
    process.exit(1);
}

const supabaseAdmin = createClient(url, key);

async function cleanupHalfCreatedAccounts() {
    console.log("Starting cleanup of half-created accounts...");

    try {
        // 1. Get ALL users from Auth
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        console.log(`Found ${users.length} total users in Auth.`);

        // 2. Get ALL profiles
        const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('user_id');
        if (profileError) throw profileError;

        const profileUserIds = new Set(profiles.map(p => p.user_id));
        console.log(`Found ${profileUserIds.size} total profiles in Public.`);

        // 3. Find users in Auth that DO NOT have a profile
        const orphanedUsers = users.filter(u => !profileUserIds.has(u.id));

        console.log(`\nFound ${orphanedUsers.length} orphaned/half-created users:`);
        
        for (const user of orphanedUsers) {
            console.log(`- Deleting orphaned user: ${user.email} (${user.id})`);
            
            // Delete from auth
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`  Failed to delete ${user.email}:`, deleteError.message);
            } else {
                console.log(`  Successfully deleted ${user.email}`);
            }
        }

        console.log("\nCleanup complete. You can now recreate these accounts.");

    } catch (e) {
        console.error("Cleanup failed:", e);
    }
}

cleanupHalfCreatedAccounts();
