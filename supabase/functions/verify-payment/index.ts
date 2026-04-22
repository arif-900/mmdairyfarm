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
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      orderId,
      isSubscription // New parameter
    } = await req.json();

    console.log("Payment verification request received:", {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      isSubscription
    });

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !orderId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay secret missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // signature verification
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpayOrderId}|${razorpayPaymentId}`);
    const key = encoder.encode(razorpayKeySecret);
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    if (expectedSignature !== razorpaySignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (isSubscription) {
      // 🔄 Update Subscription Item
      const { error: subError } = await supabaseAdmin
        .from("subscription_items")
        .update({
          status: "active",
          // We can store razorpay_payment_id if we add a column, or just update status
          // The current schema has payment_id (which usually stores order_id), 
          // let's update a common field or just the status.
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId); // Here orderId passed from client is subscription_item_id

      if (subError) throw subError;

    } else {
      // 📦 Update Normal Order
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Verification Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});