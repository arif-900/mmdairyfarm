const fetch = require('node-fetch') || globalThis.fetch;
const SUPABASE_URL = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";

async function loginAdmin() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@mmvali.com", password: "admin123" })
    });
    const data = await res.json();
    return data.access_token;
}

async function fetchFeedback(jwt) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_feedback?select=*`, {
            headers: {
                "apikey": ANON_KEY,
                "Authorization": `Bearer ${jwt}`
            }
        });
        const data = await res.json();
        console.log("Raw Feedback Data:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed to fetch:", e);
    }
}

async function run() {
    const jwt = await loginAdmin();
    if (jwt) await fetchFeedback(jwt);
}
run();
