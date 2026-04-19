import { supabase } from '../_lib/config/supabaseClient.js';
import { sendWhatsAppMessage } from '../_lib/services/whatsappService.js';
import logger from '../_lib/utils/logger.js';

/**
 * Vercel Cron Job entry point
 * Hits every X minutes to process abandoned carts.
 */
export default async function handler(req, res) {
  // Optional: Verify request is from Vercel Cron
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  logger.info('🔄 Running Abandoned Cart Cron Job via Vercel...');

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch pending orders that qualify as abandoned
    const { data: abandonedOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .eq('whatsapp_opt_in', true)
      .lt('created_at', twentyFourHoursAgo)
      .lt('retry_count', 3); // Max 3 retries

    if (error) throw error;

    if (!abandonedOrders || abandonedOrders.length === 0) {
      logger.info('✅ No abandoned carts found this cycle.');
      return res.status(200).json({ success: true, message: 'No abandoned carts' });
    }

    logger.info(`📦 Found ${abandonedOrders.length} abandoned carts. Sending reminders...`);

    const results = [];
    for (const order of abandonedOrders) {
      try {
        // Fetch items for this order to get product names for {{2}}
        const { data: items } = await supabase
          .from('order_items')
          .select('product_name')
          .eq('order_id', order.id);

        const productNames = items && items.length > 0
          ? items.map(i => i.product_name).join(', ')
          : 'Dairy Products';

        const templateName = process.env.ABANDONED_CART_TEMPLATE || 'abandoned_cart_template';
        const dynamicData = [
          order.user_name || "Customer",
          productNames
        ];

        const result = await sendWhatsAppMessage(templateName, order.phone, dynamicData);

        if (result.success) {
          await supabase
            .from('orders')
            .update({ reminder_sent: true, updated_at: new Date().toISOString() })
            .eq('id', order.id);
          results.push({ id: order.id, status: 'sent' });
        } else {
          await supabase
            .from('orders')
            .update({ retry_count: (order.retry_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq('id', order.id);
          results.push({ id: order.id, status: 'failed', error: result.error });
        }
      } catch (innerError) {
        results.push({ id: order.id, status: 'error', error: innerError.message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      processed: abandonedOrders.length, 
      results 
    });

  } catch (err) {
    logger.error(`🚨 Cron Job Error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}
