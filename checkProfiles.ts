const supabaseUrl = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";
const adminId = "8e647b58-bfed-41a5-a5c7-3a4a3943e4e7"; // User's primary admin account ID

async function run() {
    // 1. Manually login as admin to get an active JWT session token
    console.log("Logging in as admin to get token...");
    // We can just bypass login if we can construct a valid JWT, but we'll use the API key for direct Edge Function invocation
    // Actually, calling the EF manually is simpler. 
    // The create-staff edge function expects a Bearer token of an admin.
    
    // Instead of fighting auth tokens, let's just query profiles directly to see if the user's test email *did* go through.
    console.log("Fetching profiles using Anon key...");
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    
    if(!res.ok) {
        console.error("Failed to fetch profiles:", res.status, res.statusText);
        return;
    }
    
    const data = await res.json();
    console.log(`Found ${data.length} profiles.`);
    data.slice(0, 5).forEach((p: any) => console.log(p.full_name, p.phone));
}

run();
