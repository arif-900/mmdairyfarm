import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
    console.log("Logging in as Admin...");
    const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@mmvali.com',
        password: 'admin123'
    });

    if (loginErr) {
        console.error("Login Error:", loginErr.message);
        return;
    }

    console.log("Invoking create-staff function...");
    const { data, error } = await supabase.functions.invoke('create-staff', {
        body: {
            email: "test.staff123@mmvali.com",
            password: "password123",
            full_name: "Test Staff",
            phone: "0000000000"
        }
    });

    if (error) {
        console.error("Function Invoke Error:", error);
    } else {
        console.log("Function Response Data:", data);
    }
}

run();
