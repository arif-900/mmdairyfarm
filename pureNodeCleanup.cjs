const url = "https://fgeyphtaehvbitwcnvoa.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZXlwaHRhZWh2Yml0d2Nudm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMTY2NCwiZXhwIjoyMDg1MDc3NjY0fQ.zM6l_bH2TzTqZ5P8UuT3_mVq0NTrX2kK8l0N90Yw0_I";

async function run() {
    try {
        console.log("Fetching profiles...");
        const pRes = await fetch(`${url}/rest/v1/profiles?select=user_id`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const profiles = await pRes.json();
        const pIds = new Set();
        if (Array.isArray(profiles)) {
            profiles.forEach(p => pIds.add(p.user_id));
        }
        console.log(`Found ${pIds.size} profiles.`);

        console.log("Fetching auth users...");
        const uRes = await fetch(`${url}/auth/v1/admin/users`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const authData = await uRes.json();
        const users = authData.users || [];
        console.log(`Found ${users.length} auth users.`);

        const orphans = users.filter((u) => !pIds.has(u.id));
        console.log(`Found ${orphans.length} orphaned accounts.`);

        let deletedCount = 0;
        for (const u of orphans) {
            console.log(`Deleting ${u.email}...`);
            const delRes = await fetch(`${url}/auth/v1/admin/users/${u.id}`, {
                method: 'DELETE',
                headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
            });
            if (delRes.ok) {
                console.log(`Deleted ${u.email} successfully.`);
                deletedCount++;
            } else {
                console.log(`Failed to delete ${u.email}: ${delRes.statusText}`);
            }
        }
        console.log(`Cleanup finished. Deleted ${deletedCount} users.`);
    } catch (err) {
        console.error("Script failed:", err);
    }
}

run();
