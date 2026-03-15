// Test script to debug order issues
// Run this in browser console on the order page

async function testOrderFlow() {
  console.log('Testing order flow...');
  
  // Test 1: Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user ? 'Authenticated' : 'Not authenticated');
  
  if (!user) {
    console.log('❌ User not authenticated - this is likely the issue');
    return;
  }
  
  // Test 2: Test edge function with minimal data
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        items: [{
          name: 'Test Product',
          description: 'Test',
          price: 100,
          quantity: 1,
          unit: 'liter'
        }],
        deliveryType: 'one-time',
        shippingAddress: 'Test Address',
        phone: '9876543210',
        paymentMethod: 'cod'
      }
    });
    
    console.log('Edge function result:', { data, error });
    
    if (error) {
      console.log('❌ Edge function error:', error);
    } else {
      console.log('✅ Edge function working');
    }
  } catch (err) {
    console.log('❌ Edge function exception:', err);
  }
}

// Run the test
testOrderFlow();