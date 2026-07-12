import { CreditCard, ShieldCheck, Wallet, CheckCircle2, Truck } from "lucide-react";
import { CircularBackButton } from "../ui/CircularBackButton";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 font-sans" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Import Roboto stylesheet locally for this component to satisfy the typography requirement */}
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />

      <div className="bg-white rounded-[16px] p-5 md:p-8 shadow-sm border border-[#E5E7EB] space-y-5 md:space-y-6">
        
        {/* Header - Sentence Case & Non-Italics */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
            <CreditCard className="text-emerald-600 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-slate-800 leading-tight">Payment Selection</h2>
            <p className="text-xs font-normal text-slate-400 mt-1">Select your preferred payment method</p>
          </div>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Online Payment Card */}
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            className={cn(
              "flex flex-col items-center gap-3 md:gap-4 p-5 md:p-8 rounded-[16px] border transition-all duration-250 relative group text-center w-full",
              paymentMethod === 'online' 
                ? "border-emerald-600 bg-emerald-50/20 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.12)]" 
                : "border-[#E5E7EB] bg-white hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-250 shrink-0 border",
              paymentMethod === 'online' 
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" 
                : "bg-slate-50 border-[#E5E7EB] text-slate-500"
            )}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm md:text-base text-slate-800">Online payment</p>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1">Cards • UPI • Net Banking</p>
            </div>

            {/* Subtle Brand Logos */}
            <div className="flex gap-2.5 mt-2 items-center justify-center opacity-60 group-hover:opacity-90 transition-opacity flex-wrap">
              {/* Mastercard */}
              <svg className="h-3 w-5 shrink-0" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B"/>
                <circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B"/>
                <path d="M12 11.835a7.487 7.487 0 0 1 2.302-5.492A7.487 7.487 0 0 1 12 3.165a7.487 7.487 0 0 1-2.302 3.178A7.487 7.487 0 0 1 12 11.835Z" fill="#FF5F00"/>
              </svg>
              {/* RuPay */}
              <span className="text-[10px] font-bold text-slate-500">RuPay</span>
              <span className="text-[10px] font-bold text-slate-300">•</span>
              {/* GPay */}
              <span className="text-[10px] font-bold text-slate-500">GPay</span>
              <span className="text-[10px] font-bold text-slate-300">•</span>
              {/* PhonePe */}
              <span className="text-[10px] font-bold text-slate-500">UPI</span>
            </div>

            {paymentMethod === 'online' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Cash on Delivery Card */}
          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            className={cn(
              "flex flex-col items-center gap-3 md:gap-4 p-5 md:p-8 rounded-[16px] border transition-all duration-250 relative group text-center w-full",
              paymentMethod === 'cod' 
                ? "border-emerald-600 bg-emerald-50/20 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.12)]" 
                : "border-[#E5E7EB] bg-white hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-250 shrink-0 border",
              paymentMethod === 'cod' 
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" 
                : "bg-slate-50 border-[#E5E7EB] text-slate-500"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm md:text-base text-slate-800">Cash on delivery</p>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1">Pay at your doorstep</p>
            </div>

            <div className="h-3 md:h-4 mt-2" /> {/* Layout alignment spacer */}

            {paymentMethod === 'cod' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Extras & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pt-6 border-t border-slate-100">
          
          {/* iOS Toggles & Delivery Info (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Toggles Container */}
            <div className="bg-slate-50 rounded-[16px] p-6 space-y-4 border border-slate-100">
              
              {/* Reward Coins Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <img src="/favicon.png" className="w-5 h-5 object-cover" alt="Coin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Use reward coins</p>
                    <p className="text-xs font-normal text-amber-600">Balance: {availableCoins}</p>
                  </div>
                </div>
                
                {/* iOS-Style Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setUseCoins(!useCoins)}
                  disabled={paymentMethod === 'cod' || availableCoins === 0}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed",
                    useCoins && paymentMethod === 'online' ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      useCoins && paymentMethod === 'online' ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* WhatsApp Switch */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-250",
                    whatsappOptIn ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-[#E5E7EB] text-slate-400"
                  )}>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm5.835-3.376l.332.197c1.786 1.059 3.864 1.62 5.992 1.621 5.922 0 10.742-4.82 10.746-10.747.002-2.871-1.116-5.571-3.149-7.602-2.033-2.031-4.736-3.147-7.611-3.148-5.932 0-10.754 4.821-10.758 10.749-.001 2.182.569 4.31 1.651 6.173l.216.369-1.002 3.659 3.738-.98zm11.385-6.735c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.736.164-.218.328-.846 1.068-1.037 1.287-.19.218-.381.246-.71.082-.328-.164-1.386-.511-2.64-1.629-.976-.87-1.635-1.947-1.826-2.275-.19-.328-.02-.505.144-.668.148-.147.328-.383.493-.574.164-.191.218-.328.328-.546.11-.219.055-.41-.027-.574-.082-.164-.736-1.776-1.01-2.431-.266-.641-.537-.552-.736-.562-.19-.01-.409-.012-.627-.012s-.573.082-.873.41c-.3.328-1.146 1.12-1.146 2.732s1.173 3.17 1.337 3.388c.164.218 2.308 3.524 5.59 4.945.78.337 1.39.539 1.865.69.784.249 1.497.214 2.061.129.629-.094 1.942-.793 2.215-1.558.272-.764.272-1.42.19-1.558-.082-.137-.3-.219-.628-.383z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Order updates</p>
                    <p className="text-xs font-normal text-slate-400">Real-time alerts via WhatsApp</p>
                  </div>
                </div>

                {/* iOS-Style Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setWhatsappOptIn(!whatsappOptIn)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                    whatsappOptIn ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      whatsappOptIn ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

            </div>

            {/* Delivery Info Banner */}
            <div className="p-6 bg-slate-50 rounded-[16px] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                  <Truck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Consolidated delivery</p>
                  <p className="text-xs font-normal text-slate-400">Expected: {format(expectedDate, "eeee, dd MMM")}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-full">
                  Free
                </span>
              </div>
            </div>

          </div>

          {/* Premium Payable Summary Card (5 Columns) */}
          <div className="lg:col-span-5 bg-slate-900 rounded-[16px] p-5 md:p-8 text-white flex flex-col justify-between shadow-md space-y-5 md:space-y-6 relative overflow-hidden">
            {/* Background design accents for Stripe-like look */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center opacity-60">
                <span className="text-xs font-medium tracking-wider">Summary</span>
                <span className="text-xs font-medium tracking-wider">Step 3 of 3</span>
              </div>
              
              <div className="pt-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400 tracking-wider">Payable total</span>
                <span className="text-[56px] font-bold text-emerald-400 leading-none transition-all duration-250">
                  ₹{totalAmount.toFixed(0)}
                </span>
              </div>
              
              {coinsApplied > 0 && (
                <div className="flex justify-between items-center text-amber-400 pt-2">
                  <span className="text-xs font-medium">Coins discount</span>
                  <span className="font-bold text-sm">- ₹{coinsApplied.toFixed(0)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10 relative z-10">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <img src="/favicon.png" className="w-4 h-4 object-cover rounded-full" alt="Coin" />
              </div>
              <span className="text-xs font-medium text-amber-500 leading-tight">
                You will earn <span className="text-sm font-bold text-amber-400">+{predictedCoinsEarned}</span> coins
              </span>
            </div>

          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 md:mt-8 pt-4">
          <CircularBackButton 
            onClick={onBack}
            className="w-12 h-12 rounded-full border-[#E5E7EB] hover:bg-slate-50 transition-colors shrink-0"
          />
          
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || (paymentMethod === 'online' && !razorpayLoaded)}
            className="flex-1 h-12 rounded-[12px] md:h-14 md:rounded-[16px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm md:text-base shadow-sm hover:shadow active:scale-[0.98] transition-all duration-250 flex items-center justify-center"
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span>Confirm order</span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
