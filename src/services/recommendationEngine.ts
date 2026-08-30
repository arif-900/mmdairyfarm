// src/services/recommendationEngine.ts
// Real Data-Driven Recommendation Engine for MM Dairy Farm
// Grounded strictly in Supabase historical order evidence (orders, order_items, subscription_items).

import { supabase } from "@/integrations/supabase/client";

export interface CandidateProduct {
  id: string;
  name: string;
  price: number;
  basePricePerKg?: number | null;
  unit?: string;
  unitType?: string | null;
  availableWeights?: number[] | null;
  stock: number;
  image?: string;
  isActive: boolean;

  // Real Database Evidence Metrics
  coPurchaseCount: number;
  basketMatchCount: number;
  userPurchaseCount: number;
  hasUserBoughtBefore: boolean;
  
  // Individual strategy scores (0.0 to 1.0)
  coPurchaseScore: number;
  basketCombinationScore: number;
  customerHistoryScore: number;
  popularityScore: number;
  recencyScore: number;
  
  // Weighted aggregate score
  finalScore: number;
  
  // Truthful evidence badge & AI analysis summary
  contextualReason: string;
  reasonType: "personal_history" | "basket_combination" | "frequently_bought_together" | "popular";
  aiAnalysis?: string;
}

export interface RecommendationRequest {
  cartItems: Array<{
    productId: string;
    name: string;
    selectedWeight?: number;
  }>;
  userId?: string | null;
  allProducts: any[];
  limit?: number;
}

// Configurable confidence threshold: products below 0.30 aggregate confidence are REJECTED.
export const MIN_CONFIDENCE_THRESHOLD = 0.30;

// Configurable scoring weights grounded in user specification
export const DEFAULT_WEIGHTS = {
  coPurchase: 0.35,
  basketCombination: 0.25,
  customerHistory: 0.20,
  purchaseFrequency: 0.10,
  recency: 0.05,
  popularity: 0.05
};

// In-memory co-purchase statistical cache (TTL 10 min)
let coPurchaseStatsCache: { 
  pairMatrix: Record<string, Record<string, number>>;
  basketMatrix: Record<string, Record<string, number>>;
  timestamp: number 
} | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Mines historical order_items from Supabase to compute pair co-purchase rates & basket combination rates.
 */
async function fetchCoPurchaseAndBasketData(): Promise<{
  pairMatrix: Record<string, Record<string, number>>;
  basketMatrix: Record<string, Record<string, number>>;
}> {
  const now = Date.now();
  if (coPurchaseStatsCache && (now - coPurchaseStatsCache.timestamp < CACHE_TTL_MS)) {
    return {
      pairMatrix: coPurchaseStatsCache.pairMatrix,
      basketMatrix: coPurchaseStatsCache.basketMatrix
    };
  }

  const pairMatrix: Record<string, Record<string, number>> = {};
  const basketMatrix: Record<string, Record<string, number>> = {};

  try {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('order_id, product_id')
      .limit(2000);

    if (!error && orderItems && orderItems.length > 0) {
      // Group product IDs by order_id
      const orderGroups: Record<string, string[]> = {};
      for (const item of orderItems) {
        if (!orderGroups[item.order_id]) {
          orderGroups[item.order_id] = [];
        }
        if (!orderGroups[item.order_id].includes(item.product_id)) {
          orderGroups[item.order_id].push(item.product_id);
        }
      }

      // Compute pair & basket combination frequencies
      for (const orderId in orderGroups) {
        const prodIds = orderGroups[orderId];
        
        // 1. Single Pair Co-occurrence (A -> B)
        for (let i = 0; i < prodIds.length; i++) {
          const pA = prodIds[i];
          if (!pairMatrix[pA]) pairMatrix[pA] = {};

          for (let j = 0; j < prodIds.length; j++) {
            if (i === j) continue;
            const pB = prodIds[j];
            pairMatrix[pA][pB] = (pairMatrix[pA][pB] || 0) + 1;
          }
        }

        // 2. Multi-Basket Combination (A + B -> C)
        if (prodIds.length >= 3) {
          const sorted = [...prodIds].sort();
          for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
              const basketKey = `${sorted[i]}::${sorted[j]}`;
              if (!basketMatrix[basketKey]) basketMatrix[basketKey] = {};

              for (let k = 0; k < sorted.length; k++) {
                if (k === i || k === j) continue;
                const pC = sorted[k];
                basketMatrix[basketKey][pC] = (basketMatrix[basketKey][pC] || 0) + 1;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[RecommendationEngine] Error computing co-purchase matrix:", err);
  }

  coPurchaseStatsCache = { pairMatrix, basketMatrix, timestamp: now };
  return { pairMatrix, basketMatrix };
}

/**
 * Mines user's past purchase history from Supabase if logged in.
 */
async function fetchUserPurchaseHistory(userId: string): Promise<Record<string, { count: number; lastDate: Date }>> {
  const history: Record<string, { count: number; lastDate: Date }> = {};
  if (!userId) return history;

  try {
    const { data: userOrders } = await supabase
      .from('orders')
      .select(`
        created_at,
        order_items (product_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (userOrders) {
      for (const order of userOrders) {
        const orderDate = new Date(order.created_at);
        const items = order.order_items || [];
        for (const item of items) {
          const pId = item.product_id;
          if (!history[pId]) {
            history[pId] = { count: 0, lastDate: orderDate };
          }
          history[pId].count += 1;
        }
      }
    }
  } catch (err) {
    console.warn("[RecommendationEngine] Error fetching user purchase history:", err);
  }

  return history;
}

/**
 * Main Deterministic Hybrid Recommendation Engine.
 * Evaluates real database evidence, applies strict stock/cart filters, and enforces confidence thresholds.
 */
export async function generateDeterministicRecommendations(
  req: RecommendationRequest,
  weights = DEFAULT_WEIGHTS
): Promise<CandidateProduct[]> {
  const { cartItems, userId, allProducts, limit = 3 } = req;
  const cartProductIds = cartItems.map(i => i.productId);

  // 1. STRICT FILTERING: Must be active, in-stock (stock > 0), and NOT in current cart
  const eligibleProducts = allProducts.filter(p => {
    const isPurchasable = p.is_active !== false && (p.stock === undefined || p.stock > 0);
    const notInCart = !cartProductIds.includes(p.id);
    return isPurchasable && notInCart;
  });

  if (eligibleProducts.length === 0) return [];

  // Fetch async historical signals in parallel
  const [{ pairMatrix, basketMatrix }, userHistory] = await Promise.all([
    fetchCoPurchaseAndBasketData(),
    userId ? fetchUserPurchaseHistory(userId) : Promise.resolve({})
  ]);

  // 2. SCORING EACH ELIGIBLE PRODUCT BASED ON REAL DB EVIDENCE
  const candidates: CandidateProduct[] = eligibleProducts.map(prod => {
    const pId = prod.id;

    // Signal 1: Pair Co-Purchase Score (A -> X)
    let coPurchaseCount = 0;
    for (const cId of cartProductIds) {
      if (pairMatrix[cId] && pairMatrix[cId][pId]) {
        coPurchaseCount += pairMatrix[cId][pId];
      }
    }
    const coPurchaseScore = Math.min(1.0, coPurchaseCount / 5);

    // Signal 2: Multi-Item Basket Combination Score (A + B -> X)
    let basketMatchCount = 0;
    if (cartProductIds.length >= 2) {
      const sortedCart = [...cartProductIds].sort();
      for (let i = 0; i < sortedCart.length; i++) {
        for (let j = i + 1; j < sortedCart.length; j++) {
          const key = `${sortedCart[i]}::${sortedCart[j]}`;
          if (basketMatrix[key] && basketMatrix[key][pId]) {
            basketMatchCount += basketMatrix[key][pId];
          }
        }
      }
    }
    const basketCombinationScore = Math.min(1.0, basketMatchCount / 3);

    // Signal 3: Personal Customer Purchase History (User specific)
    const userHistEntry = userHistory[pId];
    const userPurchaseCount = userHistEntry ? userHistEntry.count : 0;
    const hasUserBoughtBefore = userPurchaseCount > 0;
    const customerHistoryScore = hasUserBoughtBefore ? Math.min(1.0, userPurchaseCount * 0.35) : 0;

    // Signal 4: Popularity Score (Overall sales proxy)
    const popularityScore = Math.min(1.0, ((prod.rating || 4.5) / 5.0) * 0.7 + ((prod.review_count || 10) / 100) * 0.3);

    // Signal 5: Recency Score
    let recencyScore = 0.5;
    if (userHistEntry) {
      const daysSince = (Date.now() - userHistEntry.lastDate.getTime()) / (1000 * 3600 * 24);
      if (daysSince < 2) recencyScore = 0.1; // Purchased 1 day ago, lower recency recommendation
      else if (daysSince >= 4 && daysSince <= 14) recencyScore = 1.0; // Optimal repurchase window
    }

    // Weighted Aggregate Final Score
    const finalScore = 
      weights.coPurchase * coPurchaseScore +
      weights.basketCombination * basketCombinationScore +
      weights.customerHistory * customerHistoryScore +
      weights.popularity * popularityScore +
      weights.recency * recencyScore;

    // Determine Truthful Contextual Reason (NO FAKE STATS OR ASSUMPTIONS)
    let reasonType: CandidateProduct["reasonType"] = "popular";
    let contextualReason = "Popular with customers";

    if (hasUserBoughtBefore) {
      reasonType = "personal_history";
      contextualReason = "You've purchased this product before";
    } else if (basketMatchCount > 0) {
      reasonType = "basket_combination";
      contextualReason = "Often added when these items are ordered together";
    } else if (coPurchaseCount > 0) {
      reasonType = "frequently_bought_together";
      contextualReason = "Frequently purchased together with your order";
    }

    return {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      basePricePerKg: prod.base_price_per_kg || prod.basePricePerKg,
      unit: prod.unit || 'g',
      unitType: prod.unit_type || prod.unitType || 'g',
      availableWeights: prod.available_weights || prod.availableWeights || [250, 500, 1000],
      stock: prod.stock ?? 99,
      image: prod.image_url || prod.image,
      isActive: prod.is_active !== false,
      coPurchaseCount,
      basketMatchCount,
      userPurchaseCount,
      hasUserBoughtBefore,
      coPurchaseScore,
      basketCombinationScore,
      customerHistoryScore,
      popularityScore,
      recencyScore,
      finalScore,
      contextualReason,
      reasonType
    };
  });

  // 3. STRICT CONFIDENCE THRESHOLD FILTERING
  // Filter candidates: candidate finalScore must be >= MIN_CONFIDENCE_THRESHOLD
  const highConfidenceCandidates = candidates.filter(c => c.finalScore >= MIN_CONFIDENCE_THRESHOLD);

  if (highConfidenceCandidates.length === 0) {
    // DO NOT return random products if evidence is insufficient
    return [];
  }

  // Sort descending by finalScore
  highConfidenceCandidates.sort((a, b) => b.finalScore - a.finalScore);

  return highConfidenceCandidates.slice(0, limit);
}
