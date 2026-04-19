// api/ai/tools/executor.js
// Logic for executing tools called by Gemini.

/**
 * Main entry point for tool execution.
 */
export async function executeTool(name, args) {
  switch (name) {
    case 'getWebsiteInfo':
      return getWebsiteInfo();
    default:
      return { error: `Tool ${name} not found` };
  }
}

/**
 * Provides static business information.
 */
function getWebsiteInfo() {
  return {
    business: 'MM Dairy Farm',
    locations: ['Bhanakacherla', 'Nandyal', 'Andhra Pradesh'],
    tagline: 'Farm-fresh milk at your doorstep',
    contacts: {
      whatsapp:   '+91 63098 35752', // Updated
      email:      'mmvalidairyfarm@gmail.com',
      website:    'https://mmdairyfarm.com'
    },
    products: [
      { name: 'Buffalo Milk', price: '₹85 / Litre',  features: 'Thick, fresh, creamy' },
      { name: 'Cow Milk',     price: '₹60 / Litre',  features: 'Healthy, pure' },
      { name: 'Fresh Curd',   price: '₹100 / KG',     features: 'Traditional homemade style' },
      { name: 'Pure Ghee',    price: '₹1400 / KG',    features: 'Bilona method, aromatic' },
      { name: 'Paneer',       price: '₹270 / KG',     features: 'Fresh, soft' }
    ],
    delivery: {
      timing: 'Every morning (5:00 AM - 8:00 AM)',
      radius: '50 km around Nandyal',
      fees: '0-5km: Free, 5-10km: ₹30, 10-20km: ₹50, 20-50km: ₹100'
    },
    paymentMethods: ['Cash on Delivery (COD)', 'UPI', 'Cards', 'Net Banking'],
    onlinePaymentFee: '1.5% convenience fee applies to razorpay online transactions',
    contact: 'WhatsApp: +91 63098 35752' // Updated
  };
}
