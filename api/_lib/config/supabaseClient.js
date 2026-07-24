import { createClient } from '@supabase/supabase-js';

// Vercel handles env vars natively

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_'))
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);

export default supabase;
