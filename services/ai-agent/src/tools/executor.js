// ai-agent/src/tools/executor.js
// Executes function calls made by Gemini against the real Supabase database.
// All user-scoped queries include .eq('user_id', userId) — zero data leakage.
// Schema matches: supabase/migrations/20260123164213_...sql and related files.

import { supabase } from '../../config/supabaseClient.js';

// ── ORDER TOOLS ───────────────────────────────────────────────────────────────

async function getOrders({ userId, limit = 10 }) {
  if (!userId) return { error: 'userId is required' };
  const safeLimit = Math.min(Math.max(1, Number(limit)), 50);

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, delivery_type, payment_method,
      shipping_address, phone, created_at, updated_at,
      order_items (
        quantity, unit_price,
        products ( name, unit, price )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[getOrders]', error.message);
    return { error: 'Failed to fetch orders', detail: error.message };
  }
  if (!orders?.length) return { orders: [], message: 'No orders found for this user.' };

  return { total: orders.length, orders: orders.map(formatOrder) };
}

async function getOrderByIndex({ userId, index }) {
  if (!userId) return { error: 'userId is required' };
  const idx = Number(index);
  if (!idx || idx < 1) return { error: 'index must be a positive number' };

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, delivery_type, payment_method,
      shipping_address, phone, created_at, updated_at,
      order_items (
        quantity, unit_price,
        products ( name, unit, price )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(idx);

  if (error) return { error: 'Failed to fetch order', detail: error.message };
  if (!orders?.length) return { error: 'You have no orders yet.' };
  if (idx > orders.length) {
    return {
      error: `You only have ${orders.length} order(s). Order #${idx} does not exist.`,
      totalOrders: orders.length
    };
  }

  return { position: idx, order: formatOrder(orders[idx - 1]) };
}

async function getOrderById({ userId, orderId }) {
  if (!userId) return { error: 'userId is required' };
  if (!orderId) return { error: 'orderId is required' };

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, delivery_type, payment_method,
      shipping_address, phone, created_at, updated_at,
      order_items (
        quantity, unit_price,
        products ( name, unit, price )
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)  // ownership check — CRITICAL for security
    .single();

  if (error || !order) return { error: 'Order not found or does not belong to your account.' };
  return { order: formatOrder(order) };
}

async function searchOrdersByProduct({ userId, productName }) {
  if (!userId) return { error: 'userId is required' };
  if (!productName) return { error: 'productName is required' };

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, created_at,
      order_items (
        quantity, unit_price,
        products ( name, unit )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to search orders', detail: error.message };

  const term = productName.toLowerCase().trim();
  const matched = (orders || []).filter(o =>
    o.order_items?.some(i => i.products?.name?.toLowerCase().includes(term))
  );

  if (!matched.length) {
    return { found: false, message: `No orders found containing "${productName}".`, productName };
  }
  return { found: true, productName, count: matched.length, orders: matched.map(formatOrder) };
}

// ── PRODUCT TOOLS ─────────────────────────────────────────────────────────────

async function getProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price, unit, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) return { error: 'Failed to fetch products', detail: error.message };
  if (!products?.length) return { products: [], message: 'No products currently available.' };

  return {
    total: products.length,
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: `₹${p.price}`,
      priceRaw: p.price,
      unit: p.unit
    }))
  };
}

// ── USER PROFILE ──────────────────────────────────────────────────────────────

async function getUserProfile({ userId }) {
  if (!userId) return { error: 'userId is required' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, phone, address, created_at, reward_coins')
    .eq('user_id', userId)
    .single();

  if (error || !profile) return { error: 'Profile not found for this user.' };

  return {
    profile: {
      name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      rewardCoins: profile.reward_coins ?? 0,
      memberSince: new Date(profile.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    }
  };
}

// ── WEBSITE INFO (static curated knowledge) ───────────────────────────────────

async function getWebsiteInfo() {
  return {
    business: {
      name: 'MM Dairy Farm (MMVALI Dairy Farm)',
      tagline: 'Farm-fresh dairy products delivered to your door',
      whatsapp: '+91 63098 35752',
      email: 'mmvalidairyfarm@gmail.com',
      adminEmail: 'admin@mmvali.com'
    },
    delivery: {
      coverageArea: 'Within 50 km radius of the farm',
      schedule: 'Morning delivery only',
      subscriptionStart: 'Daily subscriptions begin the next morning after order placement',
      oneTime: 'One-time orders delivered based on availability'
    },
    payments: {
      methods: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'],
      onlineFee: 'Online payment via Razorpay',
      processor: 'Razorpay (secure payment gateway)'
    },
    returns: {
      policy: 'Report quality issues within 24 hours of delivery via WhatsApp or email. Refunds are returned to the original payment method.',
      contact: 'WhatsApp: +91 63098 35752 or mmvalidairyfarm@gmail.com'
    },
    rewards: {
      program: 'Loyalty coins earned on every order — redeem for discounts on future orders'
    },
    features: [
      'Farm-fresh dairy products sourced daily',
      'Morning doorstep delivery within 65 km',
      'Flexible one-time or daily subscription orders',
      'Secure online payments via Razorpay',
      'WhatsApp order notifications and tracking',
      'Loyalty coins reward system',
      'PWA — installable on mobile as an app',
      'Real-time AI chat assistant'
    ]
  };
}

// ── FORMATTER ─────────────────────────────────────────────────────────────────

function formatOrder(order) {
  const items = (order.order_items || []).map(item => ({
    product: item.products?.name || 'Unknown product',
    unit: item.products?.unit || '',
    quantity: item.quantity,
    unitPrice: item.unit_price != null ? `₹${item.unit_price}` : null
  }));

  return {
    orderId: order.id,
    status: order.status,
    totalAmount: `₹${order.total_amount}`,
    deliveryType: order.delivery_type,
    paymentMethod: order.payment_method,
    shippingAddress: order.shipping_address,
    phone: order.phone,
    placedOn: new Date(order.created_at).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    lastUpdated: new Date(order.updated_at).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    items
  };
}

// ── DISPATCHER ────────────────────────────────────────────────────────────────

/**
 * Execute a named function called by Gemini.
 *
 * @param {string} toolName   - Function name from Gemini's functionCall
 * @param {object} toolInput  - Arguments from Gemini's functionCall.args
 * @returns {Promise<object>} - Structured result sent back to Gemini
 */
export async function executeTool(toolName, toolInput) {
  // console.log(`[Tool] ${toolName}`, JSON.stringify(toolInput));
  try {
    switch (toolName) {
      case 'getOrders': return await getOrders(toolInput);
      case 'getOrderByIndex': return await getOrderByIndex(toolInput);
      case 'getOrderById': return await getOrderById(toolInput);
      case 'getProducts': return await getProducts();
      case 'getUserProfile': return await getUserProfile(toolInput);
      case 'getWebsiteInfo': return await getWebsiteInfo();
      case 'searchOrdersByProduct': return await searchOrdersByProduct(toolInput);
      default: return { error: `Unknown function: ${toolName}` };
    }
  } catch (err) {
    console.error(`[Tool] Error in ${toolName}:`, err.message);
    return { error: `Function execution failed: ${err.message}` };
  }
}
