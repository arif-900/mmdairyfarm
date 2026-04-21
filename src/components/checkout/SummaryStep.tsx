import { ShoppingBag, ArrowRight, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeight } from "@/utils/pricing";
import { cn } from "@/lib/utils";

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
}

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
  onNext
}: SummaryStepProps) {
  if (items.length === 0) return (
    <div className="text-center py-20 bg-white rounded-[40px] border shadow-sm">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 italic uppercase">Your cart is empty</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Add some freshness to get started</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <ShoppingBag className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Order Summary</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your selected products</p>
          </div>
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
                    {formatWeight(item.selectedWeight, item.unitType)} × {item.quantity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800 italic tracking-tighter">₹{item.calculatedPrice * item.quantity}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">₹{item.calculatedPrice} / unit</p>
              </div>
            </div>
          ))}
        </div>

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
          className="w-full h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 group active:scale-95 transition-all flex items-center justify-between px-8 mt-10"
        >
          <span className="text-left font-black tracking-widest">Proceed to Delivery</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
