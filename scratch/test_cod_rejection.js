// scratch/test_cod_rejection.js
import fetch from 'node-fetch';

async function testCodRejection() {
  console.log("Testing COD rejection on create-checkout function / endpoint...");
  
  // Test create-checkout contract / edge function or express endpoint
  try {
    const res = await fetch('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'test', name: 'Milk', price: 60, quantity: 1 }],
        payment_method: 'cod',
        shipping_address: '123 Test St',
        phone: '9959091618'
      })
    });
    
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", data);
  } catch (err) {
    console.log("Request failed or server not listening on 3000:", err.message);
  }
}

testCodRejection();
