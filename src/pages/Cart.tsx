import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatWeight } from "@/utils/pricing";
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

const Cart = () => {
  const navigate = useNavigate();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    totalPrice, 
    totalItems,
    toggleItemSelection
  } = useCart();

  const selectedItems = items.filter(item => item.selected);
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.calculatedPrice * item.quantity), 0);

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
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
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "group bg-white rounded-[32px] p-4 pr-6 border transition-all duration-300 flex items-center gap-6",
                      item.selected ? "border-primary/20 shadow-lg shadow-primary/5" : "border-slate-100 opacity-60 grayscale-[0.5]"
                    )}
                  >
                    {/* Checkbox */}
                    <button 
                      onClick={() => toggleItemSelection(item.id)}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                        item.selected 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-white border-slate-200"
                      )}
                    >
                      {item.selected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in duration-300" />}
                    </button>

                    {/* Image */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                      <img src={item.image} className="w-full h-full object-contain p-2" alt={item.name} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 italic truncate">{item.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {formatWeight(item.selectedWeight, item.unitType as any)} • ₹{item.calculatedPrice} / unit
                      </p>
                      
                      {/* Quantity Selector for Mobile/Small tablets */}
                      <div className="flex items-center gap-4 mt-4 lg:hidden">
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 px-3 border border-slate-100">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Desktop */}
                    <div className="hidden lg:flex items-center bg-slate-50 rounded-2xl p-1 px-4 border border-slate-100 shadow-inner">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90 shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total & Remove */}
                    <div className="text-right shrink-0 min-w-[100px]">
                      <p className="font-black text-slate-900 text-lg italic tracking-tighter">₹{item.calculatedPrice * item.quantity}</p>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-2 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-6 flex justify-between items-center">
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
                <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
                  <div>
                    <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tight">Summary</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review your order before checkout</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">Subtotal ({selectedItems.length} items)</span>
                      <span className="font-black italic">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">Estimated Shipping</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Calculated at Next Step</span>
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
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Secure Payment</span>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
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
