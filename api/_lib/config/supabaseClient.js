import { createClient } from '@supabase/supabase-js';

// Vercel handles env vars natively

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase credentials (URL or Service Role Key) missing from Environment Variables.');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseServiceRoleKey || ''
);

export default supabase;
