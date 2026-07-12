import { ShoppingBag, ArrowRight, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeight, calculatePrice } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { useStoreProducts } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

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
  const { products, loading: productsLoading } = useStoreProducts();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});

  if (items.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border shadow-sm font-body">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 italic uppercase">Your cart is empty</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Add some freshness to get started</p>
    </div>
  );

  // Dynamic context-based recommendation algorithm
  const suggestions = useMemo(() => {
    // 1. Filter out items already in the order
    const itemProductIds = items.map(item => item.productId);
    const available = products.filter(prod => !itemProductIds.includes(prod.id));

    // 2. Identify active categories in the cart
    const hasMilk = items.some(item => item.name.toLowerCase().includes("milk"));
    const hasCurd = items.some(item => item.name.toLowerCase().includes("curd"));
    const hasGhee = items.some(item => item.name.toLowerCase().includes("ghee"));

    // 3. Dynamic scoring based on complementary pairs & upsell thresholds
    return available.sort((a, b) => {
      const getScore = (prod: any) => {
        let score = 0;
        const name = prod.name.toLowerCase();
        
        // Milk pairs best with Ghee & Curd
        if (hasMilk) {
          if (name.includes("ghee")) score += 4;
          if (name.includes("curd")) score += 3;
        }
        // Curd pairs best with Paneer
        if (hasCurd && name.includes("paneer")) score += 4;
        // Ghee pairs best with Paneer
        if (hasGhee && name.includes("paneer")) score += 3;
        // Suggest high value items if close to free shipping limit
        if (subtotal < 1000 && subtotal >= 600 && prod.price >= 200) score += 2;
        
        return score;
      };

      return getScore(b) - getScore(a);
    }).slice(0, 3);
  }, [products, items, subtotal]);

  const adjustQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 font-body">
      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <ShoppingBag className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Order Summary</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your selected products</p>
          </div>
        </div>

        {/* Free Delivery Promo Banner */}
        <div className="mb-8 p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary">
            <span>Free Delivery Status</span>
            <span>{subtotal >= 1000 ? "Unlocked!" : `₹${subtotal} / ₹1000`}</span>
          </div>
          <div className="w-full bg-slate-100/60 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {subtotal >= 1000 ? (
              <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                🎉 Congratulations! Your order qualifies for FREE delivery.
              </span>
            ) : (
              <span>
                Add <strong className="text-foreground">₹{(1000 - subtotal).toFixed(0)}</strong> more to unlock <strong className="text-primary font-bold">FREE Delivery</strong> on this order!
              </span>
            )}
          </p>
        </div>

        {/* Items List */}
        <div className="space-y-4 mb-10">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-3xl border border-slate-100/50 group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm italic">{item.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {formatWeight(item.selectedWeight, item.unitType)}
                  </p>
                  
                  {/* Inline Quantity Modifier (Edit) */}
                  <div className="flex items-center gap-2 mt-2 bg-white rounded-xl p-0.5 border border-slate-200 w-fit shadow-sm">
                    <button 
                      onClick={() => onUpdateQty(item.productId, item.selectedWeight, -1)}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQty(item.productId, item.selectedWeight, 1)}
                      className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Price & Delete Action (Delete) */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-black text-slate-800 italic tracking-tighter text-base">₹{item.calculatedPrice * item.quantity}</p>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest">₹{item.calculatedPrice} / unit</p>
                </div>
                
                <button
                  onClick={() => onRemoveItem(item.productId, item.selectedWeight)}
                  className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors shadow-sm"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Add-ons with Analysis */}
        {suggestions.length > 0 && (
          <div className="mb-10 space-y-4 pt-6 border-t border-slate-100">
            <div>
              <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">Suggested Add-ons</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Best pairings & nutrition analysis for your basket</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {suggestions.map((prod) => {
                const qty = quantities[prod.id] || 1;
                const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
                const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);

                return (
                  <div key={prod.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/5 rounded-3xl border border-primary/10 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                        <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 text-sm">{prod.name}</p>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[8px] font-bold uppercase py-0.5 px-2">
                            Analysis
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal max-w-md">
                          {productAnalyses[prod.name] || productAnalyses["default"]}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          ₹{currentPrice} / {formatWeight(activeWeight, prod.unitType || "g")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                      {/* Weight Selector */}
                      {prod.availableWeights && prod.availableWeights.length > 1 && (
                        <select
                          value={activeWeight}
                          onChange={(e) => setSelectedWeights(prev => ({ ...prev, [prod.id]: Number(e.target.value) }))}
                          className="bg-white border border-slate-200 rounded-xl px-2 h-9 text-xs font-bold text-slate-700 outline-none shadow-sm focus:border-primary/30 transition-colors"
                        >
                          {prod.availableWeights.map(w => (
                            <option key={w} value={w}>
                              {formatWeight(w, prod.unitType || "g")}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Qty Selector */}
                      <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200">
                        <button 
                          onClick={() => adjustQty(prod.id, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">{qty}</span>
                        <button 
                          onClick={() => adjustQty(prod.id, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
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
                          // Reset state
                          setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                        }}
                        className="h-9 px-4 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm"
                      >
                        + Add to Order
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing & Promo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 block">Promotional Code</label>
            {!appliedPromo ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 h-14 text-sm font-bold placeholder:text-slate-300 outline-none focus:border-primary/30 transition-all uppercase"
                />
                <Button
                  onClick={handleApplyPromo}
                  disabled={checkingPromo || !promoInput.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest group"
                >
                  {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">✓</span> 
                    {appliedPromo.code} Applied
                  </p>
                  <p className="text-xs font-bold text-emerald-800 italic mt-0.5">{appliedPromo.description}</p>
                </div>
                <button onClick={removePromo} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Remove</button>
              </div>
            )}
            {promoMessage && !appliedPromo && (
              <p className={cn("text-[10px] font-black uppercase tracking-widest px-2", promoMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-500')}>
                {promoMessage.text}
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtotal</span>
              <span className="font-black text-sm italic text-slate-800">₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                <span className="font-black text-sm italic">- ₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-800">Est. Total</span>
              <span className="text-2xl font-black italic tracking-tighter text-slate-900">₹{subtotal - discountAmount}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={onNext}
          className="w-full h-16 rounded-[28px] bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 group active:scale-95 transition-all flex items-center justify-between px-8 mt-10"
        >
          <span className="text-left font-black tracking-widest">Proceed to Delivery</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
