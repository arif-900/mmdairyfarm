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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { orderId } = await req.json();

    // 1. Get Auth User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // 2. Fetch Order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // 3. Authorization Check
    // User can only cancel their own order. Admins/Staff can cancel any.
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = userRole?.role === "admin" || userRole?.role === "staff";
    const isOwner = order.user_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new Error("Forbidden");
    }

    // 4. Status Check
    const cancellableStatuses = ["pending", "paid", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(`Order cannot be cancelled in status: ${order.status}`);
    }

    // 5. Gateway Refund Processing via Razorpay
    const requiresGatewayRefund = order.status === "paid" || order.status === "processing";
    let refundId = null;

    if (requiresGatewayRefund) {
      const razorpayPaymentId = order.razorpay_payment_id;
      if (!razorpayPaymentId) {
        throw new Error("Cannot process refund: missing Razorpay payment transaction ID for this order.");
      }

      const rzpKey = Deno.env.get("RAZORPAY_KEY_ID");
      const rzpSecret = Deno.env.get("RAZORPAY_KEY_SECRET");

      if (!rzpKey || !rzpSecret) {
        throw new Error("Razorpay credentials not configured on server.");
      }

      const response = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${rzpKey}:${rzpSecret}`)}`,
        },
        body: JSON.stringify({
          amount: Math.round(order.total_amount * 100), // Full refund to original payment method
          notes: {
            order_id: order.id,
            reason: "Order cancellation refund to original payment method",
          },
        }),
      });

      const refundData = await response.json();

      if (!response.ok) {
        console.error("Razorpay gateway refund failed:", refundData);
        throw new Error(`Razorpay refund failed: ${refundData.error?.description || "Gateway error"}`);
      }

      refundId = refundData.id;
    }

    // 6. Update DB Status
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "cancelled",
        refund_id: refundId,
        refund_status: refundId ? "processed" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      throw new Error("Failed to update order status in DB");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isOnlinePayment ? "Order cancelled and refund processed" : "Order cancelled",
        refundId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("Refund error:", err.message);

    return new Response(
      JSON.stringify({
        error: err.message || "Internal Server Error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
