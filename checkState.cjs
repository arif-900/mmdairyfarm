const url = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMTY2NCwiZXhwIjoyMDg1MDc3NjY0fQ.zM6l_bH2TzTqZ5P8UuT3_mVq0NTrX2kK8l0N90Yw0_I";

async function run() {
    try {
        const pRes = await fetch(`${url}/rest/v1/profiles?select=user_id,full_name`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }});
        const profiles = await pRes.json();
        const pIds = new Set(profiles.map(p => p.user_id));

        const uRes = await fetch(`${url}/auth/v1/admin/users`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }});
        const { users } = await uRes.json();

        console.log(`=== DB STATE ===`);
        console.log(`Profiles: ${profiles.length}`);
        console.log(`Auth Users: ${users.length}`);
        
        const orphans = users.filter((u) => !pIds.has(u.id));
        console.log(`Orphans: ${orphans.length}`);
        if(orphans.length > 0) {
            console.log(orphans.map(o => o.email));
        }

    } catch (err) {
        console.error("Script failed:", err);
    }
}
run();
