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

    console.log("Fetching products to find an ID...");
    const { data: feedData, error: feedErr } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (feedErr) {
        console.error("Fetch Error:", feedErr);
    } else if (feedData && feedData.length > 0) {
        const prodId = feedData[0].id;
        console.log(`Attempting to update stock for product ${prodId} to 100...`);
        const { data: updateData, error: updateErr } = await supabase
            .from('products')
            .update({ stock: 100 })
            .eq('id', prodId)
            .select();

        if (updateErr) {
            console.error("Update Error:", updateErr);
        } else {
            console.log("Update Success! New Data:", JSON.stringify(updateData, null, 2));
        }
    }
}

run();
