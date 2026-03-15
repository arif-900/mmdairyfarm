import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
    console.log("Logging in as Admin...");
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@mmvali.com',
        password: 'admin123'
    });

    if (loginErr || !session) {
        console.error("Login Error:", loginErr?.message);
        return;
    }

    console.log("Fetching Edge Function directly with native fetch...");

    // Call Edge Function directly with fetch to see raw response body
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            email: "test.staff.raw@mmvali.com",
            password: "password123",
            full_name: "Test Staff",
            phone: "0000000000"
        })
    });

    const status = response.status;
    const text = await response.text();

    console.log(`HTTP Status: ${status}`);
    console.log(`Raw Response: ${text}`);
}

run();
