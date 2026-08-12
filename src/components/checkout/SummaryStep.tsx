import { ShoppingBag, ArrowRight, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeight, calculatePrice } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { useStoreProducts } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, memo } from "react";

interface SummaryStepProps {
  items: any[];
  subtotal: number;
  promoInput: string;
  setPromoInput: (val: string) => void;
  checkingPromo: boolean;
  appliedPromo: any;
  promoMessage: any;
  handleApplyPromo: () => void;
  removePromo: () => void;
  discountAmount: number;
  onNext: () => void;
  onAddSuggested: (item: any) => void;
  onUpdateQty: (productId: string, selectedWeight: number, delta: number) => void;
  onRemoveItem: (productId: string, selectedWeight: number) => void;
}

const productAnalyses: Record<string, string> = {
  "Pure Desi Ghee": "Rich in vitamins (A, D, E) to boost immunity and gut health.",
  "Fresh Curd (Dahi)": "Loaded with natural probiotics to support healthy digestion.",
  "Artisan Paneer": "A clean, calcium-rich source of protein for muscle recovery.",
  "Buffalo Milk": "Rich, thick texture, high in calcium—perfect for home curd.",
  "Cow Milk": "Light, easily digestible, and rich in essential minerals for daily energy.",
  "Milk Kova": "Traditional sweet handmade with pure cow milk and zero preservatives.",
  "default": "Freshly sourced from our organic farms, packed with essential dairy nutrients."
};

interface SummaryItemProps {
  item: any;
  onUpdateQty: (productId: string, selectedWeight: number, delta: number) => void;
  onRemoveItem: (productId: string, selectedWeight: number) => void;
}

const SummaryItemCard = memo(function SummaryItemCard({ item, onUpdateQty, onRemoveItem }: SummaryItemProps) {
  return (
    <div className="flex justify-between items-start sm:items-center p-3 md:p-4 bg-[#10291F] rounded-2xl md:rounded-3xl border border-white/10 group gap-2 md:gap-4">
      <div className="flex items-start sm:items-center gap-3 md:gap-4 min-w-0 flex-1">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden bg-[#F1EEE7] border border-white/10 shrink-0 p-1 flex items-center justify-center">
          <img src={item.image} loading="lazy" decoding="async" className="w-full h-full object-contain" alt={item.name} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#F5F3EC] text-xs md:text-sm truncate max-w-[140px] sm:max-w-[200px]">{item.name}</p>
          <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest mt-0.5">
            {formatWeight(item.selectedWeight, item.unitType)}
          </p>
          <div className="flex items-center gap-2 mt-2 bg-[#0B2118] rounded-xl p-0.5 border border-white/10 w-fit">
            <button onClick={() => onUpdateQty(item.productId, item.selectedWeight, -1)} disabled={item.quantity <= 1} className="w-6 h-6 rounded-md bg-[#10291F] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors disabled:opacity-50"><Minus className="w-3 h-3" /></button>
            <span className="w-6 text-center text-xs font-bold text-[#F5F3EC]">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.productId, item.selectedWeight, 1)} className="w-6 h-6 rounded-md bg-[#10291F] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="text-right">
          <p className="font-display font-black text-[#C98A24] text-sm md:text-base">₹{item.calculatedPrice * item.quantity}</p>
          <p className="text-[8px] md:text-[9px] font-bold text-[#AAB8B0] uppercase tracking-widest">₹{item.calculatedPrice} / unit</p>
        </div>
        <button onClick={() => onRemoveItem(item.productId, item.selectedWeight)} className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors" title="Remove item"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
      </div>
    </div>
  );
});

export function SummaryStep({
  items,
  subtotal,
  promoInput,
  setPromoInput,
  checkingPromo,
  appliedPromo,
  promoMessage,
  handleApplyPromo,
  removePromo,
  discountAmount,
  onNext,
  onAddSuggested,
  onUpdateQty,
  onRemoveItem
}: SummaryStepProps) {
  const { products } = useStoreProducts();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});

  const suggestions = useMemo(() => {
    if (items.length === 0) return [];
    const itemProductIds = items.map(item => item.productId);
    const available = products.filter(prod => !itemProductIds.includes(prod.id));

    const hasMilk = items.some(item => item.name.toLowerCase().includes("milk"));
    const hasCurd = items.some(item => item.name.toLowerCase().includes("curd"));
    const hasGhee = items.some(item => item.name.toLowerCase().includes("ghee"));

    return available.sort((a, b) => {
      const getScore = (prod: any) => {
        let score = 0;
        const name = prod.name.toLowerCase();
        if (hasMilk) {
          if (name.includes("ghee")) score += 4;
          if (name.includes("curd")) score += 3;
        }
        if (hasCurd && name.includes("paneer")) score += 4;
        if (hasGhee && name.includes("paneer")) score += 3;
        if (subtotal < 1000 && subtotal >= 600 && prod.price >= 200) score += 2;
        return score;
      };

      return getScore(b) - getScore(a);
    }).slice(0, 3);
  }, [products, items, subtotal]);

  if (items.length === 0) return (
    <div className="text-center py-20 bg-[#0B2118] rounded-[40px] border border-white/10 shadow-xl font-body text-[#F5F3EC]">
      <div className="w-20 h-20 bg-[#10291F] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-[#C98A24]">
        <ShoppingBag className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black uppercase text-[#F5F3EC]">Your cart is empty</h2>
      <p className="text-[#AAB8B0] font-bold uppercase text-[10px] tracking-widest mt-2">Add some freshness to get started</p>
    </div>
  );

  const adjustQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  return (
    <div className="space-y-4 font-body text-[#F5F3EC]">
      <div className="bg-[#0B2118] rounded-2xl md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24]">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-black text-[#F5F3EC] uppercase tracking-tight">Order Summary</h2>
            <p className="text-[9px] font-bold text-[#AAB8B0] uppercase tracking-widest">Review your selected products</p>
          </div>
        </div>

        {/* Free Delivery Promo Banner */}
        <div className="mb-4 md:mb-8 p-3 md:p-5 bg-[#10291F] border border-white/10 rounded-xl md:rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#C98A24]">
            <span>Free Delivery Status</span>
            <span>{subtotal >= 1000 ? "Unlocked!" : `₹${subtotal} / ₹1000`}</span>
          </div>
          <div className="w-full bg-[#061A13] rounded-full h-2 overflow-hidden border border-white/10">
            <div 
              className="bg-[#C98A24] h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#AAB8B0] leading-relaxed">
            {subtotal >= 1000 ? (
              <span className="font-semibold text-[#4ADE80] flex items-center gap-1.5">
                🎉 Congratulations! Your order qualifies for FREE delivery.
              </span>
            ) : (
              <span>
                Add <strong className="text-[#F5F3EC]">₹{(1000 - subtotal).toFixed(0)}</strong> more to unlock <strong className="text-[#C98A24] font-bold">FREE Delivery</strong> on this order!
              </span>
            )}
          </p>
        </div>

        {/* Items List */}
        <div className="space-y-2.5 md:space-y-4 mb-6 md:mb-8">
          {items.map((item, idx) => (
            <SummaryItemCard key={`${item.productId}-${idx}`} item={item} onUpdateQty={onUpdateQty} onRemoveItem={onRemoveItem} />
          ))}
        </div>

        {/* Suggested Add-ons */}
        {suggestions.length > 0 && (
          <div className="mb-6 md:mb-8 space-y-3 pt-4 border-t border-white/10">
            <div>
              <h3 className="font-display text-xs sm:text-sm font-black text-[#F5F3EC] uppercase tracking-wider">Suggested Add-ons</h3>
              <p className="text-[9px] font-bold text-[#AAB8B0] uppercase tracking-widest">Best pairings & nutrition analysis for your basket</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {suggestions.map((prod) => {
                const qty = quantities[prod.id] || 1;
                const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
                const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);

                return (
                  <div key={prod.id} className="flex flex-col items-center p-3 bg-[#10291F] rounded-2xl border border-white/10 gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F1EEE7] border border-white/10 flex-shrink-0 p-1 flex items-center justify-center">
                      <img src={prod.image} loading="lazy" decoding="async" className="w-full h-full object-contain" alt={prod.name} />
                    </div>
                    <div className="space-y-0.5 w-full">
                      <p className="font-bold text-[#F5F3EC] text-[11px] truncate max-w-[120px] mx-auto">{prod.name}</p>
                      <p className="text-[9px] font-bold text-[#C98A24] uppercase tracking-wider">
                        ₹{currentPrice} / {formatWeight(activeWeight, prod.unitType || "g")}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        onAddSuggested({
                          productId: prod.id,
                          name: prod.name,
                          selectedWeight: activeWeight,
                          calculatedPrice: currentPrice,
                          quantity: qty,
                          image: prod.image,
                          unitType: prod.unitType || "g",
                          deliveryDays: prod.deliveryDays || 0
                        });
                        setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                      }}
                      className="w-full h-7 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] mt-1"
                    >
                      + Add Item
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing & Promo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6 border-t border-white/10">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#AAB8B0] px-1 block">Promotional Code</label>
            {!appliedPromo ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  className="flex-1 bg-[#10291F] border border-white/10 rounded-xl px-4 h-12 text-sm font-bold text-[#F5F3EC] placeholder:text-[#718078] focus:border-[#C98A24] outline-none uppercase"
                />
                <Button
                  onClick={handleApplyPromo}
                  disabled={checkingPromo || !promoInput.trim()}
                  className="bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] rounded-xl h-12 px-6 font-bold uppercase text-xs tracking-widest"
                >
                  {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#10291F] border border-white/10 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-[#4ADE80] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#4ADE80] text-[#061A13] rounded-full flex items-center justify-center text-[8px] font-black">✓</span> 
                    {appliedPromo.code} Applied
                  </p>
                  <p className="text-xs font-bold text-[#F5F3EC] mt-0.5">{appliedPromo.description}</p>
                </div>
                <button onClick={removePromo} className="text-[10px] font-bold text-rose-400 uppercase hover:underline">Remove</button>
              </div>
            )}
          </div>

          <div className="bg-[#10291F] rounded-2xl p-4 md:p-6 space-y-3 border border-white/10">
            <div className="flex justify-between items-center text-[#AAB8B0]">
              <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
              <span className="font-bold text-sm text-[#F5F3EC]">₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-[#4ADE80]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Discount</span>
                <span className="font-bold text-sm">- ₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5F3EC]">Est. Total</span>
              <span className="text-2xl font-black text-[#C98A24]">₹{subtotal - discountAmount}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={onNext}
          className="w-full h-14 md:h-16 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase tracking-widest shadow-xl flex items-center justify-between px-6 mt-6 transition-all hover:-translate-y-0.5"
        >
          <span className="text-xs md:text-sm font-black tracking-widest">Proceed to Delivery</span>
          <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>
    </div>
  );
}
