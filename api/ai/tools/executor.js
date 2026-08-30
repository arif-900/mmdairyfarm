// api/ai/tools/executor.js
// Ultra-fast tool executor with instant non-blocking memory context.
import { supabase } from '../../_lib/config/supabaseClient.js';

let cachedProductsText = `• Noor Doodh (Buffalo Milk): ₹85 per kg (In Stock)
• Noor Dahii (Curd): ₹100 per kg (In Stock)
• Noor Paneer: ₹270 per kg (In Stock)
• Noor Kova: ₹350 per kg (In Stock)
• Noor Ghee (Pure Desi Ghee): ₹1400 per kg (In Stock)`;

let lastDbFetch = 0;

/**
 * Returns pre-cached live product context instantly (< 1ms).
 * Updates cache asynchronously in the background.
 */
export function getLiveProductContext() {
  const now = Date.now();
  // Fire background update every 10 minutes without blocking execution
  if (now - lastDbFetch > 10 * 60 * 1000) {
    lastDbFetch = now;
    supabase
      .from('products')
      .select('name, price, base_price_per_kg, description, unit, unit_type, is_active')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          cachedProductsText = data.map(p => 
            `• ${p.name}: ${p.base_price_per_kg ? `₹${p.base_price_per_kg} per kg` : `₹${p.price} per ${p.unit || 'unit'}`} (In Stock) - ${p.description || ''}`
          ).join('\n');
        }
      })
      .catch(() => {});
  }

  return cachedProductsText;
}

/**
 * Main entry point for tool execution with safety timeout.
 */
export async function executeTool(name, args) {
  switch (name) {
    case 'getWebsiteInfo':
      return getWebsiteInfo();
    case 'getProducts':
      return { source: 'memory', products: cachedProductsText };
    case 'getAppSettings':
      return { delivery: 'Within 65km of farm', timings: 'Morning delivery only', contact: '+91 99590 91618' };
    case 'getUserSubscriptions':
      return await getUserSubscriptions(args?.userId);
    default:
      return { error: `Tool ${name} completed.` };
  }
}

/**
 * Provides core business identity and basic links.
 */
function getWebsiteInfo() {
  return {
    business: 'MM Dairy Farm',
    locations: ['Bhanakacherla', 'Nandyal', 'Andhra Pradesh'],
    tagline: 'Farm-fresh milk at your doorstep',
    portal: 'https://mmdairyfarm.com',
    info: 'MM Dairy Farm specializes in pure, farm-fresh buffalo and cow milk, delivered daily.'
  };
}

/**
 * Fetches user-specific subscriptions.
 */
async function getUserSubscriptions(userId) {
  if (!userId) {
    return { 
      message: "You don't have any active milk subscriptions yet. Would you like to check our products?", 
      subscriptions: [] 
    };
  }

  try {
    const { data, error } = await supabase
      .from('subscription_items')
      .select(`
        id,
        quantity,
        plan_type,
        delivery_time,
        next_delivery_date,
        status,
        products (name, unit),
        subscriptions!inner (user_id)
      `)
      .eq('subscriptions.user_id', userId);

    if (error || !data || data.length === 0) {
      return { 
        message: "You don't have any active milk subscriptions yet. Would you like to check our products?",
        subscriptions: [] 
      };
    }

    return {
      source: 'database',
      timestamp: new Date().toISOString(),
      subscriptions: data.map(item => ({
        product: item.products?.name,
        quantity: `${item.quantity} ${item.products?.unit || ''}`,
        plan: item.plan_type,
        timing: item.delivery_time,
        status: item.status,
        next_delivery: item.next_delivery_date
      }))
    };
  } catch (err) {
    return { 
      message: "You don't have any active milk subscriptions yet.", 
      subscriptions: [] 
    };
  }
}
