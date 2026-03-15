import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fgeyphtaehvbitwcnvoa.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("Missing SURPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log("Attempting to create user exactly like the Edge Function does...");

    // Hardcode test data
    const email = "test.staff.debug@mmvali.com";
    const password = "password123";
    const full_name = "Test Staff Debug";
    const phone = "0987654321";

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name,
            phone
        }
    });

    if (authError) {
        console.error("Create User Error:", authError);
    } else {
        console.log("Create User Success:", authData);

        console.log("Waiting 500ms for trigger...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const { error: profileErr } = await supabaseAdmin
            .from('profiles')
            .update({ full_name, phone })
            .eq('user_id', authData.user.id);

        console.log("Profile Update Error:", profileErr || "None");

        const { error: roleErr } = await supabaseAdmin
            .from('user_roles')
            .update({ role: 'staff' })
            .eq('user_id', authData.user.id);

        console.log("Role Update Error:", roleErr || "None");

        // Cleanup by deleting the test user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log("Cleaned up test user.");
    }
}

run();
