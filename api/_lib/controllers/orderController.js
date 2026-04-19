import { supabase } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';

/**
 * Create a new order (Pending state)
 */
export const createOrder = async (req, res) => {
  try {
    const { user_id, user_name, phone, total_amount, shipping_address, whatsapp_opt_in } = req.body;

    if (!user_id || !phone || !total_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderData = {
      user_id,
      user_name,
      phone,
      total_amount,
      status: 'pending',
      delivery_type: req.body.delivery_type || 'one-time',
      payment_method: req.body.payment_method || 'online',
      shipping_address: shipping_address || 'Test Address', // Ensure not null
      created_at: req.body.created_at || new Date().toISOString() // Allow backdating
    };

    if (whatsapp_opt_in !== undefined) orderData.whatsapp_opt_in = whatsapp_opt_in;

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Order created: ${data.id} for user ${user_id}`);
    
    res.status(201).json(data);
  } catch (err) {
    logger.error(`Error creating order: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update Order Status and send notification
 */
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status, metadata } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId and status are required' });
    }

    // Validate status is allowed
    const allowedStatuses = ['pending', 'paid', 'processing', 'confirmed', 'shipped', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Fetch order first to get phone and opt-in info
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent duplicate sends by checking if status is already updated
    if (order.status === status) {
      return res.status(200).json({ success: true, message: `Status is already ${status}` });
    }

    // Update status and any metadata provided
    const updateData = { 
      status, 
      updated_at: new Date().toISOString(),
      ...(metadata || {}) 
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return res.status(500).json({ error: 'Database Update Failed', detail: updateError.message });
    }

    logger.info(`Order ${orderId} status updated to ${status}`);

    return res.status(200).json({ success: true, status });
  } catch (err) {
    logger.error(`Critical error updating order status: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', detail: err.message });
    }
  }
};

/**
 * Fetch Abandoned Carts (For manual check/dashboard)
 */
export const getAbandonedOrders = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .lt('created_at', twentyFourHoursAgo);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching abandoned orders: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
