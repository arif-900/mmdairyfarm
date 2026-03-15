const url = "https://fgeyphtaehvbitwcnvoa.supabase.co/rest/v1/subscriptions?select=id%2Cuser_id%2Cproduct_id%2Cquantity%2Cfrequency%2Cstart_date%2Cstatus%2Cdelivery_address%2Ccreated_at&order=created_at.desc";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDE2NjQsImV4cCI6MjA4NTA3NzY2NH0.O3nEWcfD3s0T8TsZGT14kK1E26tAkOjtbtzQfIUIG_E";

async function run() {
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                console.log("Keys:", Object.keys(data[0]));
            } else {
                console.log("Table exists but is empty.");
            }
        } else {
            console.log("Error Body Response:");
            console.log(JSON.stringify(await response.json(), null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}
run();
