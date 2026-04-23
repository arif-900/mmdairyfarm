// api/ai/tools/executor.js
// Logic for executing tools called by Gemini.
import { supabase } from '../../_lib/config/supabaseClient.js';

/**
 * Main entry point for tool execution.
 */
export async function executeTool(name, args) {
  switch (name) {
    case 'getWebsiteInfo':
      return getWebsiteInfo();
    case 'getProducts':
      return getProducts();
    case 'getAppSettings':
      return getAppSettings();
    case 'getUserSubscriptions':
      return getUserSubscriptions(args.userId);
    default:
      return { error: `Tool ${name} not found` };
  }
}

/**
 * Fetches the current active product list from Supabase.
 */
async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, base_price_per_kg, description, unit, unit_type, is_active, available_weights')
      .eq('is_active', true);

    if (error) {
      console.error('[DATABASE_ERROR:getProducts]', error);
      throw error;
    }

    return {
      source: 'database',
      timestamp: new Date().toISOString(),
      products: data.map(p => ({
        name: p.name,
        price: p.base_price_per_kg ? `₹${p.base_price_per_kg} per kg` : `₹${p.price} per ${p.unit || 'unit'}`,
        description: p.description,
        unit: p.unit || p.unit_type,
        options: p.available_weights ? `${p.available_weights.join(', ')}ml/g available` : null,
        status: 'In Stock'
      }))
    };
  } catch (err) {
    console.error('[Tool:getProducts]', err.message);
    return { error: `Failed to fetch products: ${err.message}` };
  }
}

/**
 * Fetches global application settings from Supabase.
 */
async function getAppSettings() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, description');

    if (error) throw error;

    const settings = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });

    return {
      source: 'database',
      timestamp: new Date().toISOString(),
      settings
    };
  } catch (err) {
    console.error('[Tool:getAppSettings]', err.message);
    return { error: 'Failed to fetch settings from database' };
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
    info: 'MM Dairy Farm specializes in pure, farm-fresh buffalo and cow milk, delivered daily. Use the getProducts tool for current prices.'
  };
}

/**
 * Fetches user-specific subscriptions.
 */
async function getUserSubscriptions(userId) {
  if (!userId) {
    return { error: 'No user ID provided. Please ask the user to log in.' };
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

    if (error) throw error;

    if (!data || data.length === 0) {
      return { 
        message: "You don't have any active subscriptions yet. Would you like to check our products and start one?",
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
    console.error('[Tool:getUserSubscriptions]', err.message);
    return { error: `Failed to fetch subscriptions: ${err.message}` };
  }
}
