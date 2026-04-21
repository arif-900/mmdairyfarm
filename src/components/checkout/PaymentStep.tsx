import { CreditCard, ArrowLeft, ShieldCheck, Wallet, CheckCircle2, ShoppingBag, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PaymentStepProps {
  paymentMethod: "online" | "cod";
  setPaymentMethod: (method: "online" | "cod") => void;
  whatsappOptIn: boolean;
  setWhatsappOptIn: (val: boolean) => void;
  useCoins: boolean;
  setUseCoins: (val: boolean) => void;
  availableCoins: number;
  coinsApplied: number;
  totalAmount: number;
  isProcessing: boolean;
  razorpayLoaded: boolean;
  handleSubmit: (e: any) => void;
  onBack: () => void;
  selectedAddress: any;
  shippingFee: number;
  predictedCoinsEarned: number;
  expectedDate: Date;
}

export function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  whatsappOptIn,
  setWhatsappOptIn,
  useCoins,
  setUseCoins,
  availableCoins,
  coinsApplied,
  totalAmount,
  isProcessing,
  razorpayLoaded,
  handleSubmit,
  onBack,
  selectedAddress,
  shippingFee,
  predictedCoinsEarned,
  expectedDate
}: PaymentStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CreditCard className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Payment Selection</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select your preferred payment method</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            className={cn(
              "flex flex-col items-center gap-4 p-8 rounded-[38px] border-2 transition-all duration-500 relative group text-center",
              paymentMethod === 'online' 
                ? "border-primary bg-emerald-50/5 shadow-2xl shadow-emerald-100" 
                : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
              paymentMethod === 'online' ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-slate-50 text-slate-400"
            )}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className={cn("font-black text-base uppercase italic tracking-tighter", paymentMethod === 'online' ? "text-primary" : "text-slate-800")}>Online Payment</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Cards • UPI • NetBanking</p>
            </div>
            {paymentMethod === 'online' && (
              <div className="absolute top-6 right-6 w-7 h-7 bg-primary rounded-full flex items-center justify-center animate-in zoom-in border-4 border-white shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            className={cn(
              "flex flex-col items-center gap-4 p-8 rounded-[38px] border-2 transition-all duration-500 relative group text-center",
              paymentMethod === 'cod' 
                ? "border-primary bg-emerald-50/5 shadow-2xl shadow-emerald-100" 
                : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
              paymentMethod === 'cod' ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-slate-50 text-slate-400"
            )}>
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className={cn("font-black text-base uppercase italic tracking-tighter", paymentMethod === 'cod' ? "text-primary" : "text-slate-800")}>Cash on Delivery</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Pay at your doorstep</p>
            </div>
            {paymentMethod === 'cod' && (
              <div className="absolute top-6 right-6 w-7 h-7 bg-primary rounded-full flex items-center justify-center animate-in zoom-in border-4 border-white shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        </div>

        {/* Extras & Total */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-slate-100">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
              <label className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center p-2">
                    <img src="/favicon.png" className="w-full h-full object-cover" alt="Coin" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 italic">Use Reward Coins</p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Balance: {availableCoins}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-11 h-6 rounded-full relative transition-all duration-300",
                  useCoins && paymentMethod === 'online' ? "bg-primary" : "bg-slate-200"
                )}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={useCoins && paymentMethod === 'online' && availableCoins > 0}
                    onChange={(e) => setUseCoins(e.target.checked)}
                    disabled={paymentMethod === 'cod' || availableCoins === 0}
                  />
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    useCoins && paymentMethod === 'online' ? "left-6" : "left-1"
                  )} />
                </div>
              </label>

              <div 
                className="flex items-center justify-between group cursor-pointer pt-4 border-t border-slate-200/50"
                onClick={() => setWhatsappOptIn(!whatsappOptIn)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    whatsappOptIn ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                  )}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-xs italic uppercase">Order Alerts</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time tracking via WhatsApp</p>
                  </div>
                </div>
                <div className={cn(
                  "w-11 h-6 rounded-full relative transition-all duration-300",
                  whatsappOptIn ? "bg-primary" : "bg-slate-200"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    whatsappOptIn ? "left-6" : "left-1"
                  )} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight italic">Consolidated Delivery</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expected: {format(expectedDate, "eeee, dd MMM")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Free for limited period</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 rounded-[32px] p-8 text-white space-y-4 shadow-xl">
             <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Summary</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Step 3 of 3</span>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-2xl font-black italic tracking-tighter uppercase">Payable Total</span>
              <span className="text-3xl font-black italic tracking-tighter text-primary">₹{totalAmount.toFixed(0)}</span>
            </div>
            {coinsApplied > 0 && (
              <div className="flex justify-between items-center text-amber-400">
                <span className="text-[10px] font-black uppercase tracking-widest italic">Coins Discount</span>
                <span className="font-black text-sm">- ₹{coinsApplied.toFixed(0)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10 opacity-70">
              <div className="w-8 h-8 rounded-full bg-amber-500 p-0.5 relative overflow-hidden shrink-0">
                <img src="/favicon.png" className="w-full h-full object-cover rounded-full" alt="Coin" />
              </div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider uppercase leading-none">You will earn <span className="text-base font-black italic">+{predictedCoinsEarned}</span> coins</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <Button 
            variant="ghost"
            onClick={onBack}
            className="flex-1 h-16 rounded-[28px] border-2 border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-800 font-black uppercase tracking-[0.2em] group"
          >
            <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-2 transition-transform" />
            Back to Delivery
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || (paymentMethod === 'online' && !razorpayLoaded)}
            className="flex-[2] h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 group active:scale-95 transition-all flex items-center justify-center px-8"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <span className="font-black tracking-widest text-lg">Confirm Order</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
