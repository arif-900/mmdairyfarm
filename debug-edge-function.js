// Test script to debug edge function
// Run this in browser console on the order page

const testEdgeFunction = async () => {
  try {
    console.log('Testing edge function...');
    
    const response = await fetch('https://fgeyphtaehvbitwcnvoa.supabase.co/functions/v1/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-fgeyphtaehvbitwcnvoa-auth-token')?.split('"')[3] || 'no-token'}`
      },
      body: JSON.stringify({
        items: [{
          name: 'Test Product',
          price: 100,
          quantity: 1,
          unit: 'liter'
        }],
        deliveryType: 'one-time',
        shippingAddress: 'Test Address',
        phone: '9876543210',
        paymentMethod: 'cod'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (!response.ok) {
      console.error('Edge function failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test
testEdgeFunction();