import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

// Vercel Serverless Adjustment: 
// Filesystem logging is not persistent on serverless. 
// Returning empty logs/stats for now until we move stats to the database.
const parseLogs = () => {
  return []; 
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    logger.info('Admin logged in successfully');
    return res.status(200).json({ success: true, token });
  }
  logger.warn(`Failed login attempt for username: ${username}`);
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
};

export const getDashboardStats = async (req, res) => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) throw error;

    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'delivered' || o.status === 'paid').length;
    
    // Abandoned - pending for more than 15 mins
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const abandoned = orders.filter(o => o.status === 'pending' && new Date(o.created_at) < twentyFourHoursAgo).length;

    const logs = parseLogs();
    const sentCount = logs.filter(l => l.status === 'sent').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;

    res.status(200).json({
      totalOrders: total,
      pendingOrders: pending,
      completedOrders: completed,
      abandonedCarts: abandoned,
      messagesSent: sentCount,
      messagesFailed: failedCount
    });
  } catch (err) {
    logger.error(`Error in getDashboardStats: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching orders: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching order ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    logger.info(`Admin manually updating order ${id} status to ${status}`);
    
    const { data: order, error: fetchError } = await supabase
      .from('orders').select('*').eq('id', id).single();
      
    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === status) return res.status(200).json({ success: true, message: `Status already ${status}` });

    const { error: updateError } = await supabase
      .from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) throw updateError;

    // Send WhatsApp if opted in
    if (order.whatsapp_opt_in && (order.retry_count || 0) < 3) {
      // Fetch order items to get product names for {{2}}
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name')
        .eq('order_id', id);

      const productNames = items && items.length > 0 
        ? items.map(i => i.product_name).join(', ') 
        : 'Dairy Products';

      let templateName = '';
      // Send Name and Product Summary (matches your {{1}} and {{2}} format)
      let dynamicData = [
        order.user_name || 'Customer',
        productNames
      ];

      if (status === 'confirmed' || status === 'paid') {
        templateName = process.env.ORDER_CONFIRMATION_TEMPLATE;
      } else if (status === 'shipped' || status === 'out_for_delivery') {
        templateName = process.env.SHIPPED_TEMPLATE;
      } else if (status === 'delivered') {
        templateName = process.env.DELIVERY_TEMPLATE;
      }

      if (templateName) {
        logger.info(`📲 Triggering WhatsApp message (${templateName}) for order ${id} by Admin`);
        // Use configured header image if exists
        const headerImage = process.env.WHATSAPP_HEADER_IMAGE || null;
        const result = await sendWhatsAppMessage(templateName, order.phone, dynamicData, headerImage);
        
        if (result.success) {
          logger.info(`✅ WhatsApp message succeeded for order ${id}`);
        } else {
          logger.error(`❌ WhatsApp message failed for order ${id}. Incrementing retry_count.`);
          await supabase.from('orders').update({ retry_count: (order.retry_count || 0) + 1 }).eq('id', id);
        }
      }
    }
    
    res.status(200).json({ success: true, status });
  } catch (err) {
    logger.error(`Error updating order ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAbandonedOrders = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('orders')
      .select('id, user_name, phone, created_at, retry_count, reminder_sent')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching abandoned orders: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const resendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin triggering manual reminder resend for order ${id}`);
    
    const { data: order, error: fetchError } = await supabase
      .from('orders').select('*').eq('id', id).single();
      
    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });
    
    const templateName = process.env.ABANDONED_CART_TEMPLATE || 'abandoned_cart_template';
    
    const dynamicData = [
      order.user_name || "Customer",
      `${process.env.FRONTEND_URL || 'https://mmdairyfarm.vercel.app'}/checkout/${order.id}`
    ];
    
    const headerImage = process.env.WHATSAPP_HEADER_IMAGE || null;
    const result = await sendWhatsAppMessage(templateName, order.phone, dynamicData, headerImage);
    
    if (result.success) {
      await supabase.from('orders').update({ reminder_sent: true, updated_at: new Date().toISOString() }).eq('id', id);
      logger.info(`✅ Manual reminder sent successfully to ${order.phone} for order ${id}`);
      res.status(200).json({ success: true, message: 'Reminder sent' });
    } else {
      await supabase.from('orders').update({ retry_count: (order.retry_count || 0) + 1 }).eq('id', id);
      logger.error(`❌ Manual reminder failed for order ${id}. Retry incremented.`);
      res.status(400).json({ success: false, error: 'Failed to send reminder - Please check API Configuration', details: result.error?.error?.message || 'Unknown' });
    }
  } catch (err) {
    logger.error(`Error resending reminder for ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLogs = (req, res) => {
  try {
    const logs = parseLogs();
    res.status(200).json(logs);
  } catch (err) {
    logger.error(`Error fetching logs: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getRetries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gt('retry_count', 0)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching retries: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const retryMessage = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin triggering manual retry for order ${id}`);
    
    const { data: order, error: fetchError } = await supabase
      .from('orders').select('*').eq('id', id).single();
      
    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });
    
    if (!order.whatsapp_opt_in) return res.status(400).json({ error: 'User opted out' });
    
    // Fetch items for retry
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name')
      .eq('order_id', id);

    const productNames = items && items.length > 0 
      ? items.map(i => i.product_name).join(', ') 
      : 'Dairy Products';

    let templateName = process.env.ORDER_CONFIRMATION_TEMPLATE;
    let dynamicData = [
      order.user_name || 'Customer',
      productNames
    ];
    
    if (order.status === 'pending') {
       templateName = process.env.ABANDONED_CART_TEMPLATE || 'abandoned_cart_template';
       dynamicData = [
         order.user_name || "Customer",
         productNames // Matching requested format for {{2}}
       ];
    } else if (order.status === 'shipped' || order.status === 'out_for_delivery') {
       templateName = process.env.SHIPPED_TEMPLATE;
    } else if (order.status === 'delivered') {
       templateName = process.env.DELIVERY_TEMPLATE;
    }
    
    // No more hello_world fallback
    if (templateName) {
      const headerImage = process.env.WHATSAPP_HEADER_IMAGE || null;
      const result = await sendWhatsAppMessage(templateName, order.phone, dynamicData, headerImage);
    
    if (result.success) {
      logger.info(`✅ Admin manual retry succeeded for order ${id}`);
      await supabase.from('orders').update({ retry_count: 0 }).eq('id', id);
      res.status(200).json({ success: true, message: 'Message sent successfully' });
    } else {
      logger.error(`❌ Admin manual retry failed for order ${id}.`);
      await supabase.from('orders').update({ retry_count: (order.retry_count || 0) + 1 }).eq('id', id);
      res.status(400).json({ success: false, error: 'Failed to send message', details: result.error?.error?.message || 'Unknown' });
      }
    }
  } catch (err) {
    logger.error(`Error on manual retry for ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAnalytics = (req, res) => {
  try {
    const logs = parseLogs();
    const totalSent = logs.filter(l => l.status === 'sent').length;
    const totalFailed = logs.filter(l => l.status === 'failed').length;
    const totalTriggers = logs.filter(l => l.status === 'triggering').length;
    
    const successRate = totalTriggers > 0 ? ((totalSent / totalTriggers) * 100).toFixed(2) : 0;
    const failureRate = totalTriggers > 0 ? ((totalFailed / totalTriggers) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      totalMessagesTriggered: totalTriggers,
      totalMessagesSent: totalSent,
      totalMessagesFailed: totalFailed,
      successRate: `${successRate}%`,
      failureRate: `${failureRate}%`
    });
  } catch (err) {
    logger.error(`Error fetching analytics: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
