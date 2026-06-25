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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch active subscription items
    const { data: items, error: subsError } = await supabase
      .from("subscription_items")
      .select("*")
      .eq("status", "active")
      .lte("next_delivery_date", todayStr)
      .lte("start_date", todayStr);

    if (subsError) {
      throw new Error(`Failed to fetch subscription items: ${subsError.message}`);
    }

    const newDeliveries = [];
    const updates = [];

    for (const item of items || []) {
      // Re-verify end_date
      if (item.end_date && item.end_date < todayStr) {
         updates.push({ id: item.id, status: 'cancelled' });
         continue;
      }

      // Check pause dates
      if (item.pause_from && item.pause_to) {
          if (todayStr >= item.pause_from && todayStr <= item.pause_to) {
              const nextDate = calculateNextDeliveryDate(item.next_delivery_date, item.plan_type);
              updates.push({ id: item.id, next_delivery_date: nextDate });
              continue;
          }
      }

      // Logic for slots (Morning/Evening/Both)
      if (item.delivery_time === 'both') {
          // Morning Slot
          newDeliveries.push({
              subscription_item_id: item.id,
              delivery_date: item.next_delivery_date, 
              delivery_slot: 'morning',
              status: 'pending',
              is_subscription: true,
              delivery_boy_id: item.assigned_rider_id || null // Hybrid: Use pre-assigned rider
          });
          // Evening Slot
          newDeliveries.push({
              subscription_item_id: item.id,
              delivery_date: item.next_delivery_date, 
              delivery_slot: 'evening',
              status: 'pending',
              is_subscription: true,
              delivery_boy_id: item.assigned_rider_id || null
          });
      } else {
          // Single Slot
          newDeliveries.push({
              subscription_item_id: item.id,
              delivery_date: item.next_delivery_date, 
              delivery_slot: item.delivery_time,
              status: 'pending',
              is_subscription: true,
              delivery_boy_id: item.assigned_rider_id || null
          });
      }

      const nextDate = calculateNextDeliveryDate(item.next_delivery_date, item.plan_type);

      updates.push({
          id: item.id,
          next_delivery_date: nextDate
      });
    }

    // Process Inserts
    if (newDeliveries.length > 0) {
        const { error: insertError } = await supabase
            .from("deliveries")
            .insert(newDeliveries);
        
        if (insertError) throw new Error(`Insert error: ${insertError.message}`);
    }

    // Upsert updates 
    if (updates.length > 0) {
        const { error: updateError } = await supabase
            .from("subscription_items")
            .upsert(updates);

        if (updateError) throw new Error(`Update error: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated_tasks: newDeliveries.length,
        updated_subscriptions: updates.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("CRON ERROR:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Internal Server Error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateNextDeliveryDate(currentDateStr: string, planType: string): string {
    const d = new Date(currentDateStr);
    
    switch (planType) {
        case 'daily':
            d.setDate(d.getDate() + 1);
            break;
        case 'alternate':
            d.setDate(d.getDate() + 2);
            break;
        case 'weekly':
            d.setDate(d.getDate() + 7);
            break;
        case 'monthly':
            d.setMonth(d.getMonth() + 1);
            break;
        default:
            d.setDate(d.getDate() + 1);
    }
    
    return d.toISOString().split("T")[0];
}
