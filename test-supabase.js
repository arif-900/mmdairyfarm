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

async function getAnOrder(jwt) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,status&limit=1`, {
        headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${jwt}` }
    });
    const data = await res.json();
    return data[0];
}

async function testUpdateOrder(jwt, order) {
    if (!order) return console.log("No order found to update!");
    console.log(`\n--- Testing UPDATE on order: ${order.id} ---`);
    try {
        const dummyStatus = order.status === 'pending' ? 'processing' : 'pending';

        const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
            method: 'PATCH',
            headers: {
                "apikey": ANON_KEY,
                "Authorization": `Bearer ${jwt}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ status: dummyStatus })
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));

        // revert
        if (res.status === 200) {
            await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
                method: 'PATCH',
                headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${jwt}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status: order.status })
            });
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

async function run() {
    const jwt = await loginAdmin();
    if (jwt) {
        const order = await getAnOrder(jwt);
        await testUpdateOrder(jwt, order);
    }
}

run();
