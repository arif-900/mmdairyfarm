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
      .select('id, name, price, description, unit_type, is_active, stock_status')
      .eq('is_active', true);

    if (error) throw error;

    return {
      source: 'database',
      timestamp: new Date().toISOString(),
      products: data.map(p => ({
        name: p.name,
        price: `₹${p.price} per ${p.unit_type || 'unit'}`,
        description: p.description,
        status: p.stock_status || 'available'
      }))
    };
  } catch (err) {
    console.error('[Tool:getProducts]', err.message);
    return { error: 'Failed to fetch products from database' };
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
