import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
    console.log("Attempting test signup...");
    const { data, error } = await supabase.auth.signUp({
        email: `test.user.${Date.now()}@mmvali.com`,
        password: 'Password123!',
        options: {
            data: {
                full_name: 'Test Setup User',
                phone: '1234567890'
            }
        }
    });

    if (error) {
        console.error("Signup Error 500 Details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } else {
        console.log("Signup Success:", data);
    }
}

run();
