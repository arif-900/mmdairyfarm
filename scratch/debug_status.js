import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStatusUpdate() {
  const testOrderId = '4459f0f6-9f79-4674-88f5-9336eee5378a'; // Replace with a real ID if needed
  console.log(`Testing status update for order: ${testOrderId}`);
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', testOrderId)
    .select();

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

testStatusUpdate();
