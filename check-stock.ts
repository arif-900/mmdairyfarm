import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking products table schema...");

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error querying products:", error);
    } else {
        console.log("Product Row Sample:");
        console.log(JSON.stringify(data[0], null, 2));
        if (data[0] && !('stock' in data[0])) {
            console.log("\n❌ CRITICAL: The 'stock' column DOES NOT EXIST in your Supabase database!");
        } else if (data[0]) {
            console.log(`\n✅ The 'stock' column exists. Value: ${data[0].stock}`);
        } else {
            console.log("\nThe table is empty, so we couldn't verify the columns.");
        }
    }
}

checkSchema();
