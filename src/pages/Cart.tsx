import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatWeight, calculatePrice } from "@/utils/pricing";
import { useStoreProducts } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, memo } from "react";
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ChevronLeft,
  Truck,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItemCardProps {
  item: any;
  onToggle: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItemCard = memo(function CartItemCard({ item, onToggle, onUpdateQty, onRemove }: CartItemCardProps) {
  return (
    <div className={cn(
      "group bg-white rounded-[32px] p-4 pr-6 border flex items-center gap-6",
      item.selected ? "border-primary/20 shadow-lg shadow-primary/5" : "border-slate-100 opacity-60 grayscale-[0.5]"
    )}>
      <button onClick={() => onToggle(item.id)}
        className={cn(
          "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
          item.selected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-slate-200"
        )}
      >
        {item.selected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in duration-300" />}
      </button>
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
        <img src={item.image} loading="lazy" decoding="async" className="w-full h-full object-contain p-2" alt={item.name} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-800 italic truncate">{item.name}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {formatWeight(item.selectedWeight, item.unitType)} • ₹{item.calculatedPrice} / unit
        </p>
        <div className="flex items-center gap-4 mt-4 lg:hidden">
          <div className="flex items-center bg-slate-50 rounded-xl p-1 px-3 border border-slate-100">
            <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 hover:text-primary transition-colors"><Minus className="w-3 h-3" /></button>
            <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 hover:text-primary transition-colors"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex items-center bg-slate-50 rounded-2xl p-1 px-4 border border-slate-100 shadow-inner">
        <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90 shadow-sm"><Minus className="w-3.5 h-3.5" /></button>
        <span className="w-12 text-center text-sm font-black text-slate-800">{item.quantity}</span>
        <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90 shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
      </div>
      <div className="text-right shrink-0 min-w-[100px]">
        <p className="font-black text-slate-900 text-lg italic tracking-tighter">₹{item.calculatedPrice * item.quantity}</p>
        <button onClick={() => onRemove(item.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-2 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Remove</button>
      </div>
    </div>
  );
});

const Cart = () => {
  const navigate = useNavigate();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    totalPrice, 
    totalItems,
    toggleItemSelection,
    addItem
  } = useCart();

  const { products, loading: productsLoading } = useStoreProducts();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});

  const selectedItems = useMemo(() => items.filter(item => item.selected), [items]);
  const subtotal = useMemo(() => selectedItems.reduce((acc, item) => acc + (item.calculatedPrice * item.quantity), 0), [selectedItems]);

  // Dynamic context-based recommendation algorithm
  const suggestions = useMemo(() => {
    // 1. Filter out items already in the cart
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
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20 font-body">
        {/* Navigation Header */}
        <section className="bg-white border-b border-slate-100 pt-16 pb-8 px-6">
          <div className="container-main max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate("/products")}
                  className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                    Your <span className="text-primary">Cart</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {totalItems} Items selected for checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-main max-w-5xl px-4 mt-12 pb-20">
          {items.length === 0 ? (
            <div className="bg-white rounded-[48px] p-20 text-center border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShoppingBag className="w-12 h-12 text-slate-200" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 italic uppercase mb-4 tracking-tight">Your cart is empty</h2>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mb-10 max-w-xs mx-auto">
                Looks like you haven't added any farm fresh products yet.
              </p>
              <Button 
                onClick={() => navigate("/products")}
                className="h-16 px-10 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                    {items.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        onToggle={toggleItemSelection}
                        onUpdateQty={updateQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                </div>

                {/* Suggested Add-ons with Analysis */}
                {suggestions.length > 0 && (
                  <div className="bg-white rounded-[32px] p-6 border border-slate-100 space-y-4 shadow-sm font-body">
                    <div>
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">Suggested Add-ons</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended pairings & nutrition analysis</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {suggestions.map((prod) => {
                        const qty = quantities[prod.id] || 1;
                        const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
                        const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);

                        return (
                          <div key={prod.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/5 rounded-2xl border border-primary/10 gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0">
                                <img src={prod.image} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={prod.name} />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-slate-800 text-xs">{prod.name}</p>
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[8px] font-bold uppercase py-0 px-1.5 h-4">
                                    Analysis
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-snug max-w-md">
                                  {productAnalyses[prod.name] || productAnalyses["default"]}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
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
                                  className="bg-white border border-slate-200 rounded-xl px-2 h-8 text-xs font-bold text-slate-700 outline-none shadow-sm focus:border-primary/30 transition-colors"
                                >
                                  {prod.availableWeights.map(w => (
                                    <option key={w} value={w}>
                                      {formatWeight(w, prod.unitType || "g")}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Quantity Selector */}
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                                <button 
                                  onClick={() => adjustQty(prod.id, -1)}
                                  className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-slate-800">{qty}</span>
                                <button 
                                  onClick={() => adjustQty(prod.id, 1)}
                                  className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => {
                                  addItem({
                                    productId: prod.id,
                                    name: prod.name,
                                    selectedWeight: activeWeight,
                                    calculatedPrice: currentPrice,
                                    quantity: qty,
                                    image: prod.image,
                                    unitType: prod.unitType || "g",
                                    deliveryDays: prod.deliveryDays || 0
                                  });
                                  // Reset quantity back to 1
                                  setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                                }}
                                className="h-8 px-3 bg-primary hover:bg-primary/95 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shrink-0 shadow-sm"
                              >
                                + Add to Cart
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/products")}
                    className="text-slate-400 hover:text-primary font-black uppercase text-[10px] tracking-widest group"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add more products
                  </Button>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                    Pure & Fresh From Our Farm
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tight">Summary</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review your order before checkout</p>
                  </div>

                  {/* Free Delivery Promo widget */}
                  {selectedItems.length > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-primary">
                        <span>Free Delivery Progress</span>
                        <span>{subtotal >= 1000 ? "Unlocked!" : `₹${subtotal} / ₹1000`}</span>
                      </div>
                      <div className="w-full bg-slate-100/60 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div 
                          className="bg-primary h-full transition-all duration-500 rounded-full" 
                          style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {subtotal >= 1000 ? (
                          <span className="font-semibold text-emerald-600">
                            🎉 Your order qualifies for FREE delivery!
                          </span>
                        ) : (
                          <span>
                            Add <strong>₹{(1000 - subtotal).toFixed(0)}</strong> more for <strong>FREE Delivery</strong>!
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">Subtotal ({selectedItems.length} items)</span>
                      <span className="font-black italic">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">Estimated Shipping</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {subtotal >= 1000 ? "FREE" : "Calculated next step"}
                      </span>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-800">Total Amount</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Incl. all taxes</p>
                      </div>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter italic">₹{subtotal}</span>
                    </div>
                  </div>

                  <Button 
                    disabled={selectedItems.length === 0}
                    onClick={() => navigate("/order")}
                    className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 group active:scale-95 transition-all flex items-center justify-between px-8"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Button>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-4">
                    <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Fast Delivery</p>
                      <p className="text-[10px] font-bold text-amber-700/70 mt-1 leading-relaxed">
                        Orders placed before 8 PM will be delivered by tomorrow morning.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Secure Payment</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Farm Fresh</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
