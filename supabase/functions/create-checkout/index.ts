import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FARM_LOCATION = { lat: 15.8022, lng: 78.5356 };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Shipping fee
function getShippingFee(distanceKm: number): number {
  if (distanceKm <= 5) return 0;
  if (distanceKm <= 10) return 30;
  if (distanceKm <= 20) return 50;
  if (distanceKm <= 50) return 100;
  return -1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    const {
      items,
      shipping_address,
      shipping_lat,
      shipping_lng,
      phone,
      delivery_type,
      payment_method,
      discount_amount,
      shipping_fee: feeFromClient,
      whatsapp_opt_in,
      promo_code,
      user_name: userNameFromClient
    } = body;

    // 🔒 VALIDATION
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (!shipping_address || !phone) {
      throw new Error("Shipping address and phone required");
    }

    const lat = Number(shipping_lat) || 0;
    const lng = Number(shipping_lng) || 0;

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid location coordinates");
    }

    // 🔒 AUTHORITATIVE PRODUCT LOOKUP, PRICING & STOCK CONCURRENCY CHECK
    const productIds = items.map((i: any) => i.id).filter(Boolean);
    const { data: dbProducts, error: dbProdErr } = await supabase
      .from("products")
      .select("id, name, price, base_price_per_kg, is_active, stock")
      .in("id", productIds);

    if (dbProdErr || !dbProducts) {
      throw new Error("Failed to verify product information from database");
    }

    const dbProductsMap = new Map(dbProducts.map((p: any) => [p.id, p]));

    let subtotal = 0;
    for (const item of items) {
      const dbProd = dbProductsMap.get(item.id);
      if (!dbProd) {
        throw new Error(`Product not found: ${item.name || item.id}`);
      }
      if (dbProd.is_active === false) {
        throw new Error(`Product is no longer available: ${dbProd.name}`);
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);

      // Stock Concurrency Protection
      if (dbProd.stock !== null && dbProd.stock !== undefined && dbProd.stock < quantity) {
        throw new Error(`Insufficient stock for ${dbProd.name}. Available: ${dbProd.stock}`);
      }

      // Reproduce exact business pricing logic from src/utils/pricing.ts (calculatePrice)
      const basePrice = dbProd.base_price_per_kg ? Number(dbProd.base_price_per_kg) : Number(dbProd.price);
      const weight = Number(item.selected_weight) || 1000;
      const itemUnitPrice = (dbProd.base_price_per_kg && weight) 
        ? Math.round((basePrice / 1000) * weight)
        : basePrice;

      subtotal += itemUnitPrice * quantity;

      // Atomic stock decrement
      if (dbProd.stock !== null && dbProd.stock !== undefined && dbProd.stock >= quantity) {
        await supabase
          .from("products")
          .update({ stock: dbProd.stock - quantity })
          .eq("id", dbProd.id)
          .gte("stock", quantity);
      }
    }

    // 🚚 AUTHORITATIVE SHIPPING CALCULATION (Rule: Order >= 1000 = FREE, Distance < 10 KM = FREE, Distance >= 10 KM = ₹50)
    let shippingFee = 0;
    const distance = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, lat, lng);
    if (subtotal >= 1000) {
      shippingFee = 0;
    } else if (distance < 10) {
      shippingFee = 0;
    } else if (distance <= 50) {
      shippingFee = 50;
    } else {
      throw new Error("Delivery location is outside our 50km service area");
    }

    // 🏷️ AUTHORITATIVE PROMO CODE VALIDATION
    let discount = 0;
    let validPromoCode = null;
    if (body.promo_code) {
      const { data: promoData } = await supabase
        .from("promo_codes")
        .select("code, discount_type, discount_value, is_active")
        .eq("code", String(body.promo_code).trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promoData) {
        validPromoCode = promoData.code;
        if (promoData.discount_type === "percentage") {
          discount = Math.round((subtotal * Number(promoData.discount_value)) / 100);
        } else {
          discount = Number(promoData.discount_value);
        }
      }
    }

    let totalAmount = Math.max(0, subtotal + shippingFee - discount);

    // 👤 USER (SAFE)
    let userId = null;
    let userName = null;
    let currentCoins = 0;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getUser(token);
        userId = data?.user?.id ?? null;

        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, reward_coins")
            .eq("user_id", userId)
            .single();
          userName = profile?.full_name ?? null;
          currentCoins = profile?.reward_coins ?? 0;
        }
      } catch (err) {
        // Auth failed, continuing without user
      }
    }

    // 💰 COINS LOGIC (Single Source of Truth: 4 Coins = ₹1, 1 Coin = 25 Paise)
    let coinsToUse = Math.max(0, Math.floor(Number(body.coins_used) || 0));
    let coinDiscountRupees = 0;

    if (coinsToUse > 0) {
      if (!userId) throw new Error("Must be logged in to use coins");
      if (currentCoins < coinsToUse) throw new Error("Insufficient coins balance");

      // 4 Coins = ₹1 -> 25 paise per coin
      const coinDiscountPaise = coinsToUse * 25;
      coinDiscountRupees = coinDiscountPaise / 100;

      // Cap discount if exceeds remaining payable total
      if (coinDiscountRupees > totalAmount) {
        coinDiscountRupees = totalAmount;
        coinsToUse = Math.floor(totalAmount * 4);
      }

      // Update profile immediately to lock coins
      const { error: coinErr } = await supabase
        .from("profiles")
        .update({ reward_coins: currentCoins - coinsToUse })
        .eq("user_id", userId);

      if (coinErr) throw new Error("Failed to apply coins");

      totalAmount = Math.max(0, totalAmount - coinDiscountRupees);

      // Log in wallet_ledger
      await supabase.from("wallet_ledger").insert({
        user_id: userId,
        amount: coinsToUse,
        type: "debit",
        reason: `Redeemed ${coinsToUse} Coins for ₹${coinDiscountRupees} checkout discount`,
        metadata: { coins_used: coinsToUse, rupee_discount: coinDiscountRupees }
      });
    }

    // Earn 4 Coins per ₹100 spent (equivalent to 1% cashback value)
    const coinsEarned = totalAmount > 0 ? Math.floor((totalAmount / 100) * 4) : 0;"lAmount * 0.02) : 0;

    // 📦 DELIVERY DAYS (NO BUG)
    const deliveryDays = items.reduce(
      (max: number, i: any) =>
        Math.max(max, Number(i.delivery_days ?? 0)),
      0
    );

    const expectedDate = new Date(
      Date.now() + deliveryDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 🔒 REJECT COD REQUESTS
    if (payment_method === "cod") {
      throw new Error("Cash on Delivery is no longer supported. Please select Online Payment.");
    }

    const finalPaymentMethod = totalAmount === 0 ? "wallet" : "online";

    // 🧾 INSERT ORDER (SAFE DEFAULTS)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        shipping_address: shipping_address,
        shipping_lat: shipping_lat,
        shipping_lng: shipping_lng,
        shipping_fee: shippingFee,
        phone: phone,
        delivery_type: delivery_type ?? "standard",
        payment_method: finalPaymentMethod,
        status: totalAmount === 0 ? "processing" : "pending",
        order_delivery_days: deliveryDays,
        expected_delivery_date: expectedDate,
        user_name: userNameFromClient || userName || "Customer",
        whatsapp_opt_in: whatsapp_opt_in === true,
        discount_amount: discount,
        promo_code: promo_code || null,
        coins_used: coinsToUse,
        coins_earned: coinsEarned
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER ERROR:", orderError);
      throw new Error(orderError.message);
    }


    // 📦 INSERT ITEMS
    const itemsInsert = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.id,
      product_name: i.name,
      quantity: Number(i.quantity),
      price_at_order: Number(i.price),
      delivery_days: Number(i.delivery_days ?? 0),
      selected_weight: i.selected_weight,
      unit_type: i.unit_type,
      variant_label: i.variant_label,
    }));

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(itemsInsert);

    if (itemError) {
      console.error("ITEM ERROR:", itemError);
      throw new Error(itemError.message);
    }

    // 💵 FULLY PAID BY COINS/DISCOUNT (0 BALANCE)
    if (totalAmount === 0) {
      return new Response(
        JSON.stringify({
          orderId: order.id,
          totalAmount,
          shipping_fee: shippingFee,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 💳 RAZORPAY
    const rzpKey = Deno.env.get("RAZORPAY_KEY_ID");
    const rzpSecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!rzpKey || !rzpSecret) {
      throw new Error("Online payment not configured");
    }

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${rzpKey}:${rzpSecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order.id,
      }),
    });

    const rzpResText = await rzpRes.text();
    if (!rzpRes.ok) {
      console.error("RAZORPAY FULL ERROR:", rzpResText);
      try {
        const parsed = JSON.parse(rzpResText);
        throw new Error(`Razorpay Error: ${parsed.error?.description || parsed.error?.message || rzpResText}`);
      } catch (e) {
        throw new Error(`Razorpay Error: ${rzpResText}`);
      }
    }

    const rzpOrder = JSON.parse(rzpResText);

    await supabase
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        razorpayOrderId: rzpOrder.id,
        razorpayKeyId: rzpKey,
        amount: Math.round(totalAmount * 100),
        orderId: order.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("FINAL ERROR:", err);

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
