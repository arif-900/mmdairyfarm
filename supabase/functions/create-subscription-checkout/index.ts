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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const rzpKey = Deno.env.get("RAZORPAY_KEY_ID");
    const rzpSecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase config missing");
    if (!rzpKey || !rzpSecret) throw new Error("Razorpay config missing");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { 
        productId, 
        config, 
        addressId,
        user_name,
        phone 
    } = body;

    // 1. Auth Validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) throw new Error("Invalid session");
    const userId = userData.user.id;

    // 2. Fetch Product & Validate Price
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (pError || !product) throw new Error("Product not found");

    const pricePerUnit = product.price; // Correct price from DB
    
    // 3. Recalculate Total
    const quantity = Number(config.quantity);
    const deliveries = Number(config.totalDeliveries);
    const totalAmount = pricePerUnit * quantity * deliveries;

    if (totalAmount <= 0) throw new Error("Invalid order total");

    // 4. Get Address Details
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .single();
    if (!address) throw new Error("Address not found");

    // 5. Create Subscription (Container)
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .insert({
          user_id: userId,
          address: address.address_line,
          address_id: addressId
      })
      .select()
      .single();
    if (subError) throw subError;

    // 6. Create Subscription Item
    const { data: item, error: itemError } = await supabase
      .from('subscription_items')
      .insert({
          subscription_id: sub.id,
          product_id: productId,
          quantity: quantity,
          plan_type: config.frequency,
          delivery_time: config.timing,
          start_date: config.startDate,
          end_date: config.endDate,
          next_delivery_date: config.startDate,
          price_per_unit: pricePerUnit,
          status: 'paused' // Remains paused until payment is verified
      })
      .select()
      .single();
    if (itemError) throw itemError;

    // 7. Initiate Razorpay Order
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${rzpKey}:${rzpSecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: item.id, // Linking item directly to receipt
        notes: {
            subscription_item_id: item.id,
            user_id: userId,
            type: 'prepaid_subscription'
        }
      }),
    });

    if (!rzpRes.ok) {
       const errText = await rzpRes.text();
       throw new Error(`Razorpay failed: ${errText}`);
    }

    const rzpOrder = await rzpRes.json();

    // 8. Update Item with Razorpay Order ID
    await supabase
      .from('subscription_items')
      .update({ payment_id: rzpOrder.id })
      .eq('id', item.id);

    return new Response(
      JSON.stringify({
        razorpayOrderId: rzpOrder.id,
        razorpayKeyId: rzpKey,
        amount: Math.round(totalAmount * 100),
        subscriptionItemId: item.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
