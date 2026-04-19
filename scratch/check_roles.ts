import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .limit(100);

  if (error) {
    console.error('Error:', error);
  } else {
    const roles = [...new Set(data.map(r => r.role))];
    console.log('Unique Roles in DB:', roles);
  }
}

checkRoles();
