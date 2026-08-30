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
      payment_method: 'online',
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
    const userId = req.user?.id;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId and status are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate status is allowed
    const allowedStatuses = ['pending', 'paid', 'processing', 'confirmed', 'shipped', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Fetch user's role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const userRole = roleData?.role;

    // Fetch order first to check permissions and get status/opt-in details
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Auth validation check:
    // User is authorized if they are 'admin' or 'staff',
    // OR if they are the rider assigned to this order (assigned_to === user.id)
    // OR if they are claiming an unassigned order (setting status to 'picked_up' while assigned_to is null)
    const isAuthorized = 
      userRole === 'admin' || 
      userRole === 'staff' || 
      order.assigned_to === userId ||
      (status === 'picked_up' && !order.assigned_to);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to update this order.' });
    }

    // Prevent duplicate status updates
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

    logger.info(`Order ${orderId} status updated to ${status} by user ${userId}`);

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
