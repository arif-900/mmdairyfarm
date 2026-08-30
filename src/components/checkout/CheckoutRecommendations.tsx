// src/components/checkout/CheckoutRecommendations.tsx
// Data-Driven "RECOMMENDED FOR YOU" section for MM Dairy Farm Order Summary & Checkout
// Grounded strictly in Supabase historical order evidence with server-side AI ranking & truthful badging.

import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Plus, Check, BrainCircuit, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreProducts } from "@/data/products";
import { formatWeight, calculatePrice } from "@/utils/pricing";
import { CandidateProduct } from "@/services/recommendationEngine";
import { getPersonalizedRecommendations } from "@/services/aiRecommendationService";
import { trackRecommendationEvent } from "@/services/recommendationAnalytics";
import { useAuth } from "@/contexts/AuthContext";

interface CheckoutRecommendationsProps {
  cartItems: Array<{
    productId: string;
    name: string;
    selectedWeight?: number;
  }>;
  onAddItem: (item: {
    productId: string;
    name: string;
    selectedWeight: number;
    calculatedPrice: number;
    quantity: number;
    image?: string;
    unitType?: string;
    deliveryDays?: number;
  }) => void;
  title?: string;
  subtitle?: string;
}

export function CheckoutRecommendations({
  cartItems,
  onAddItem,
  title = "RECOMMENDED FOR YOU",
  subtitle = "Based on your order & what customers usually buy together"
}: CheckoutRecommendationsProps) {
  const { products, loading: productsLoading } = useStoreProducts();
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState<CandidateProduct[]>([]);
  const [isAiRanked, setIsAiRanked] = useState<boolean>(false);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Memoize current cart product IDs
  const cartProductIds = useMemo(() => cartItems.map(i => i.productId).join(","), [cartItems]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      if (productsLoading || !products || products.length === 0 || cartItems.length === 0) {
        setRecommendations([]);
        setLoadingRecs(false);
        return;
      }

      setLoadingRecs(true);
      try {
        const result = await getPersonalizedRecommendations({
          cartItems,
          userId: user?.id ?? null,
          allProducts: products,
          limit: 3
        });

        if (isMounted) {
          setRecommendations(result.recommendations);
          setIsAiRanked(result.isAiRanked);

          // Track telemetry for shown recommendations
          result.recommendations.forEach(rec => {
            trackRecommendationEvent({
              eventType: "shown",
              productId: rec.id,
              productName: rec.name,
              reason: rec.contextualReason,
              score: rec.finalScore,
              userId: user?.id
            });
          });
        }
      } catch (err) {
        console.warn("[CheckoutRecommendations] Error loading recommendations:", err);
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [cartProductIds, productsLoading, user?.id]);

  if (loadingRecs) {
    return (
      <div className="mb-6 md:mb-8 space-y-3 pt-4 border-t border-white/10 animate-pulse font-body">
        <div className="h-4 w-40 bg-[#10291F] rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-36 bg-[#10291F] rounded-2xl border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  // RELEVANCE > QUANTITY: Hide section gracefully if no high-confidence recommendations exist
  if (recommendations.length === 0) {
    return null;
  }

  const handleAdd = (prod: CandidateProduct) => {
    const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
    const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);

    trackRecommendationEvent({
      eventType: "added_to_cart",
      productId: prod.id,
      productName: prod.name,
      reason: prod.contextualReason,
      score: prod.finalScore,
      userId: user?.id
    });

    onAddItem({
      productId: prod.id,
      name: prod.name,
      selectedWeight: activeWeight,
      calculatedPrice: currentPrice,
      quantity: 1,
      image: prod.image,
      unitType: prod.unitType || "g",
      deliveryDays: 0
    });

    setAddedIds(prev => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  return (
    <div className="mb-6 md:mb-8 space-y-3 pt-4 border-t border-white/10 font-body">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs sm:text-sm font-black text-[#F5F3EC] uppercase tracking-wider">
            {title}
          </h3>
          
          {/* TRUTHFUL SOURCE BADGE */}
          {isAiRanked ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-[#C98A24]/20 text-[#D9A441] border border-[#C98A24]/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <BrainCircuit className="w-2.5 h-2.5 text-[#D9A441]" /> AI Ranked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <BarChart2 className="w-2.5 h-2.5 text-emerald-400" /> Based on purchase patterns
            </span>
          )}
        </div>
        <p className="text-[9px] sm:text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Grid of Dynamic Recommendation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {recommendations.map((prod) => {
          const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
          const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);
          const isAdded = addedIds[prod.id];

          return (
            <div 
              key={prod.id} 
              className="flex flex-col justify-between p-3.5 bg-[#10291F] hover:bg-[#133226] rounded-2xl border border-white/10 hover:border-[#C98A24]/40 transition-all shadow-md group relative overflow-hidden"
            >
              {/* TRUTHFUL CONTEXTUAL REASON BADGE */}
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold text-[#D9A441] bg-[#061A13] border border-[#C98A24]/30 px-2 py-0.5 rounded-full truncate max-w-full">
                  <Sparkles className="w-2.5 h-2.5 text-[#D9A441] shrink-0" />
                  <span className="truncate">{prod.contextualReason}</span>
                </span>
              </div>

              {/* Product Image & Info */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F1EEE7] border border-white/10 shrink-0 p-1 flex items-center justify-center">
                  <img 
                    src={prod.image} 
                    loading="lazy" 
                    decoding="async" 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                    alt={prod.name} 
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold text-[#F5F3EC] text-xs truncate">{prod.name}</p>
                  <p className="font-display font-black text-[#C98A24] text-xs mt-0.5">
                    ₹{currentPrice} <span className="text-[9px] font-bold text-[#AAB8B0] uppercase">/ {formatWeight(activeWeight, prod.unitType || "g")}</span>
                  </p>
                </div>
              </div>

              {/* Weight Variant Selector (if multiple available) */}
              {prod.availableWeights && prod.availableWeights.length > 1 && (
                <div className="flex items-center gap-1 mb-2.5 overflow-x-auto custom-scrollbar pb-0.5">
                  {prod.availableWeights.map((wt) => (
                    <button
                      key={wt}
                      onClick={() => setSelectedWeights(prev => ({ ...prev, [prod.id]: wt }))}
                      className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border transition-colors shrink-0 ${
                        activeWeight === wt 
                          ? "bg-[#C98A24] text-[#061A13] border-[#C98A24]" 
                          : "bg-[#061A13] text-[#AAB8B0] border-white/10 hover:border-white/30"
                      }`}
                    >
                      {formatWeight(wt, prod.unitType || "g")}
                    </button>
                  ))}
                </div>
              )}

              {/* Add Item Button */}
              <Button
                size="sm"
                onClick={() => handleAdd(prod)}
                disabled={isAdded}
                className={`w-full h-8 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 ${
                  isAdded 
                    ? "bg-emerald-500 text-slate-950" 
                    : "bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] active:scale-95"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Added to Order
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Item
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
