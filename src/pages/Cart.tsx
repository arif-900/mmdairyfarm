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
      "group bg-[#0B2118] rounded-2xl p-3 pr-4 border flex items-center gap-3 shadow-xl transition-all",
      item.selected ? "border-[#C98A24]/40 bg-[#0B2118]" : "border-white/10 opacity-50 grayscale"
    )}>
      <button onClick={() => onToggle(item.id)}
        className={cn(
          "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
          item.selected ? "bg-[#C98A24] border-[#C98A24] text-[#061A13] shadow-sm font-bold" : "bg-[#10291F] border-white/10"
        )}
      >
        {item.selected && <div className="w-2 h-2 bg-[#061A13] rounded-full animate-in zoom-in duration-300" />}
      </button>
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F1EEE7] border border-white/10 shrink-0 flex items-center justify-center p-1">
        <img src={item.image} loading="lazy" decoding="async" className="w-full h-full !object-contain" alt={item.name} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-[#F5F3EC] text-xs sm:text-sm truncate">{item.name}</h3>
        <p className="text-[9px] font-bold text-[#AAB8B0] uppercase tracking-wider mt-0.5">
          {formatWeight(item.selectedWeight, item.unitType)} • <span className="text-[#C98A24]">₹{item.calculatedPrice}</span> / unit
        </p>
        <div className="flex items-center gap-4 mt-2 lg:hidden">
          <div className="flex items-center bg-[#10291F] rounded-lg p-0.5 px-2 border border-white/10">
            <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 text-[#F5F3EC] hover:text-[#C98A24] transition-colors"><Minus className="w-2.5 h-2.5" /></button>
            <span className="w-6 text-center text-xs font-bold text-[#F5F3EC]">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 text-[#F5F3EC] hover:text-[#C98A24] transition-colors"><Plus className="w-2.5 h-2.5" /></button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex items-center bg-[#10291F] rounded-xl p-0.5 px-3 border border-white/10">
        <button onClick={() => onUpdateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-[#0B2118] border border-white/10 flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-all active:scale-90"><Minus className="w-3 h-3" /></button>
        <span className="w-8 text-center text-xs font-bold text-[#F5F3EC]">{item.quantity}</span>
        <button onClick={() => onUpdateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-[#0B2118] border border-white/10 flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-all active:scale-90"><Plus className="w-3 h-3" /></button>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display font-black text-sm text-[#C98A24]">
          ₹{item.calculatedPrice * item.quantity}
        </p>
        <button onClick={() => onRemove(item.id)} className="p-1 text-[#718078] hover:text-rose-400 transition-colors mt-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
      <div className="bg-[#061A13] min-h-screen pb-20 font-body text-[#F5F3EC]">
        {/* Navigation Header */}
        <section className="bg-[#082D20] border-b border-white/10 pt-16 pb-8 px-6">
          <div className="container-main max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate("/products")}
                  className="w-12 h-12 rounded-full bg-[#0B2118] border border-white/10 flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-all shadow-sm group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h1 className="font-display text-4xl font-black text-[#F5F3EC] tracking-tighter uppercase">
                    YOUR <span className="text-[#C98A24]">CART</span>
                  </h1>
                  <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest mt-1">
                    {totalItems} Items selected for checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-main max-w-5xl px-4 mt-12 pb-20">
          {items.length === 0 ? (
            <div className="bg-[#0B2118] rounded-3xl p-16 text-center border border-white/10 shadow-2xl">
              <div className="w-20 h-20 bg-[#10291F] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#C98A24]">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-[#F5F3EC] uppercase mb-3 tracking-tight">Your cart is empty</h2>
              <p className="text-[#AAB8B0] font-bold uppercase text-xs tracking-widest mb-8 max-w-xs mx-auto">
                Looks like you haven't added any farm fresh products yet.
              </p>
              <Button 
                onClick={() => navigate("/products")}
                className="h-14 px-8 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
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

                {suggestions.length > 0 && (
                  <div className="bg-[#0B2118] rounded-[32px] p-6 border border-white/10 space-y-4 font-body">
                    <div>
                      <h3 className="font-display text-sm font-black text-[#F5F3EC] uppercase tracking-wider">Suggested Add-ons</h3>
                      <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest">Recommended pairings & nutrition analysis</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {suggestions.map((prod) => {
                        const qty = quantities[prod.id] || 1;
                        const activeWeight = selectedWeights[prod.id] || prod.availableWeights?.[0] || 1000;
                        const currentPrice = calculatePrice(prod.basePricePerKg || prod.price, activeWeight);

                        return (
                          <div key={prod.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#10291F] rounded-2xl border border-white/5 gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-white/10 shrink-0">
                                <img src={prod.image} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={prod.name} />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-[#F5F3EC] text-xs">{prod.name}</p>
                                </div>
                                <p className="text-[9px] font-bold text-[#AAB8B0] uppercase tracking-wider">
                                  ₹{currentPrice} / {formatWeight(activeWeight, prod.unitType || "g")}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                              <div className="flex items-center bg-[#0B2118] rounded-lg p-0.5 border border-white/10">
                                <button 
                                  onClick={() => adjustQty(prod.id, -1)}
                                  className="w-6 h-6 rounded-md bg-[#10291F] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-[#F5F3EC]">{qty}</span>
                                <button 
                                  onClick={() => adjustQty(prod.id, 1)}
                                  className="w-6 h-6 rounded-md bg-[#10291F] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors"
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
                                  setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                                }}
                                className="h-8 px-3 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] text-[9px] font-bold uppercase tracking-wider rounded-lg shrink-0 shadow-sm"
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
                    className="text-[#AAB8B0] hover:text-[#C98A24] font-bold uppercase text-xs tracking-widest group"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add more products
                  </Button>
                  <p className="text-[10px] font-bold text-[#718078] uppercase tracking-widest italic">
                    Pure & Fresh From Our Farm
                  </p>
                </div>
              </div>

              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="bg-[#0B2118] rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-black text-[#F5F3EC] uppercase tracking-tight">Summary</h2>
                    <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest mt-1">Review your order before checkout</p>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="p-4 bg-[#10291F] border border-white/10 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#C98A24]">
                        <span>Free Delivery Progress</span>
                        <span>{subtotal >= 1000 ? "Unlocked!" : `₹${subtotal} / ₹1000`}</span>
                      </div>
                      <div className="w-full bg-[#0B2118] rounded-full h-2 overflow-hidden border border-white/10">
                        <div 
                          className="bg-[#C98A24] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#AAB8B0] leading-relaxed pt-1">
                        {subtotal >= 1000 ? (
                          <span className="font-bold text-[#4ADE80]">
                            🎉 Your order qualifies for FREE delivery!
                          </span>
                        ) : (
                          <span>
                            Add <strong className="text-[#C98A24]">₹{(1000 - subtotal).toFixed(0)}</strong> more for <strong className="text-[#C98A24]">FREE Delivery</strong>!
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-[#AAB8B0]">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal ({selectedItems.length} items)</span>
                      <span className="font-black text-[#F5F3EC]">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#AAB8B0]">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Estimated Shipping</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#4ADE80] bg-[#10291F] px-2 py-0.5 rounded-md border border-white/10">
                        {subtotal >= 1000 ? "FREE" : "Calculated next step"}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[#F5F3EC]">Total Amount</p>
                        <p className="text-[8px] font-bold text-[#718078] uppercase mt-0.5">Incl. all taxes</p>
                      </div>
                      <span className="text-3xl font-black text-[#C98A24] tracking-tight">₹{subtotal}</span>
                    </div>
                  </div>

                  <Button 
                    disabled={selectedItems.length === 0}
                    onClick={() => navigate("/order")}
                    className="w-full h-14 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase tracking-widest shadow-xl group transition-all flex items-center justify-between px-6"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="bg-[#10291F] rounded-2xl p-4 border border-white/10 flex gap-3 items-start">
                    <Zap className="w-5 h-5 text-[#C98A24] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-[#F5F3EC] uppercase tracking-widest">Fast Morning Delivery</p>
                      <p className="text-[10px] font-bold text-[#AAB8B0] mt-0.5 leading-relaxed">
                        Orders placed before 10 PM will be delivered tomorrow morning.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B2118] rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                    <ShieldCheck className="w-5 h-5 text-[#C98A24]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#AAB8B0]">Secure Payment</span>
                  </div>
                  <div className="bg-[#0B2118] rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                    <Truck className="w-5 h-5 text-[#C98A24]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#AAB8B0]">Farm Fresh</span>
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
