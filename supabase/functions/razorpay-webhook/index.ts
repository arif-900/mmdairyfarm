import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "md7Ula9YJgTJdoWvXNC3g6PI";
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
        }

        const body = await req.text();

        // VERIFY WEBHOOK SIGNATURE
        const { crypto } = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
        const encoder = new TextEncoder();
        const key = encoder.encode(razorpayKeySecret);
        const data = encoder.encode(body);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch");
            return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
        }

        const event = JSON.parse(body);


        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;
            const orderId = payment.notes.order_id;

            if (orderId) {


                const { error: updateError } = await supabaseAdmin
                    .from("orders")
                    .update({
                        status: "paid",
                        payment_id: payment.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", orderId)
                    .neq("status", "paid"); // Only update if not already paid

                if (updateError) {
                    console.error("Error updating order via webhook:", updateError);
                } else {

                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
