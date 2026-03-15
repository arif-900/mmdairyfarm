import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Fetching a single row to check columns...");
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Query Failed:", error);
    } else {
        console.log("Query Success. Data:", data);
        if (data && data.length > 0) {
            console.log("Columns present in response:", Object.keys(data[0]));
        } else {
            console.log("Table is empty, but query succeeded.");
        }
    }
}

checkSchema();
