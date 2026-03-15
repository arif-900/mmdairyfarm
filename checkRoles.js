import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkRoles() {
  const { data, error } = await supabase.from('user_roles').select('*');
  console.log("ROLES DATA:", data);
  console.log("ERROR:", error);
}

checkRoles();
