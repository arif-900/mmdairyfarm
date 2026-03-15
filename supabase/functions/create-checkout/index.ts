import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    let userEmail = "";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      if (data.user) {
        userId = data.user.id;
        userEmail = data.user.email || "";
      }
    }

    const { items, shippingAddress, phone, deliveryType, paymentMethod = "online" } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items in checkout");
    }

    if (!shippingAddress || !phone) {
      throw new Error("Shipping address and phone required");
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Create Order
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        phone,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Insert Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price_at_order: item.price,
    }));

    await serviceClient.from("order_items").insert(orderItems);

    // COD Order
    if (paymentMethod === "cod") {
      return new Response(
        JSON.stringify({
          orderId: order.id,
          paymentMethod: "cod",
          totalAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay Payment
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.id,
      }),
    });

    const razorpayOrder = await razorpayResponse.json();

    // Save Razorpay order id
    await serviceClient
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId,
        amount: amountInPaise,
        currency: "INR",
        orderId: order.id,
        prefill: {
          email: userEmail,
          contact: phone,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  }

});