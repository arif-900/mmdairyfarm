import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  deliveryType: "one-time" | "daily";
  shippingAddress: string;
  phone: string;
  paymentMethod: "online";
  convenienceFee?: number;
}

export const createOrderDirectly = async (orderData: CreateOrderRequest) => {
  const { items, deliveryType, shippingAddress, phone, paymentMethod = "online", convenienceFee = 0 } = orderData;

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Calculate total
  const baseAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = baseAmount + convenienceFee;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      phone: phone,
      delivery_type: deliveryType,
      status: "pending",
      payment_method: "online",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation error:", orderError);
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Create order items
  const orderItems = items.map(item => {
    if (!item.name) {

    }
    return {
      order_id: order.id,
      product_id: item.id || "00000000-0000-0000-0000-000000000000",
      product_name: item.name || "Unknown Product",
      quantity: item.quantity || 0,
      price_at_order: item.price || 0,
    };
  });

  // Note: Convenience fee is already included in total_amount, no need to add as order item
  // (prevents foreign key constraint issues with dummy product IDs)

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Order items insertion error:", itemsError);
    
    // RLS might be blocking insertion. Log this for debugging.
    if (itemsError.code === 'PGRST301' || itemsError.message?.includes('RLS')) {
      console.error("RLS policy is blocking order items insertion. Please disable RLS on order_items table.");
    }
    // Don't throw error for items, order is already created
  } else {

  }

  return {
    orderId: order.id,
    paymentMethod,
    totalAmount,
  };
};
