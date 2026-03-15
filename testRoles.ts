import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkRoles() {
  const { data, error } = await supabase.from('user_roles').select('*');
  console.log("ROLES FORMAT:");
  if (data && data.length > 0) {
      console.log(data.map(d => `${d.user_id}: ${d.role}`));
  }
  console.log("ERROR:", error);

  const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
  console.log("\nPROFILES:");
  console.log(profiles);
}

checkRoles();
