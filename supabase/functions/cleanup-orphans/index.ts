import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
    try {
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceKey || !supabaseUrl) throw new Error("Missing env vars");
        
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        
        // 1. Get ALL users from Auth
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Get ALL profiles
        const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('user_id');
        if (profileError) throw profileError;

        // Create a set of valid user IDs that actually exist in the public profile table
        const profileUserIds = new Set(profiles.map((p: any) => p.user_id));
        
        // 3. Find users in Auth that DO NOT have a public profile mapping
        const orphanedUsers = users.filter((u: any) => !profileUserIds.has(u.id));
        
        const deletedEmails: string[] = [];
        const failedEmails: any[] = [];
        
        for (const user of orphanedUsers) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (!deleteError) {
                deletedEmails.push(user.email || '');
            } else {
                failedEmails.push({ email: user.email, error: deleteError.message });
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            total_auth_users: users.length,
            total_profiles: profiles.length,
            orphans_found: orphanedUsers.length,
            deleted_count: deletedEmails.length,
            deleted_emails: deletedEmails,
            failed_emails: failedEmails
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
