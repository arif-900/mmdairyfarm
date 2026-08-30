import { CreditCard, ShieldCheck, CheckCircle2, Truck } from "lucide-react";
import { CircularBackButton } from "../ui/CircularBackButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { coinsToRupees, formatCoinValue } from "@/utils/coins";

interface PaymentStepProps {
  paymentMethod: "online";
  setPaymentMethod?: (method: "online") => void;
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
  predictedCoinsEarned,
  expectedDate
}: PaymentStepProps) {
  return (
    <div className="space-y-6 font-body text-[#F5F3EC]">
      <div className="bg-[#0B2118] rounded-[24px] p-5 md:p-8 shadow-2xl border border-white/10 space-y-5 md:space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#F5F3EC] uppercase tracking-tight">Payment Method</h2>
            <p className="text-xs font-bold text-[#AAB8B0] uppercase tracking-wider mt-0.5">Secure Online Gateway (Cards • UPI • Net Banking)</p>
          </div>
        </div>

        {/* Online Payment Method Banner */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div
            className="flex items-center justify-between p-5 md:p-6 rounded-2xl border border-[#C98A24] bg-[#10291F] shadow-lg relative text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#C98A24] border border-[#C98A24] text-[#061A13]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-base text-[#F5F3EC]">Secure Instant Online Payment</p>
                <p className="text-xs text-[#AAB8B0] mt-0.5">Razorpay • UPI • Credit/Debit Cards • Net Banking</p>
              </div>
            </div>

            <div className="w-6 h-6 bg-[#C98A24] text-[#061A13] rounded-full flex items-center justify-center font-black text-xs shrink-0">
              ✓
            </div>
          </div>
        </div>

        {/* Extras & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pt-6 border-t border-white/10">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#10291F] rounded-2xl p-6 space-y-4 border border-white/10">
              {/* Reward Coins Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#061A13] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24]">
                    <img src="/favicon.png" className="w-5 h-5 object-cover" alt="Coin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F5F3EC]">Use Reward Coins</p>
                    <p className="text-xs font-bold text-[#C98A24]">Balance: {formatCoinValue(availableCoins)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUseCoins(!useCoins)}
                  disabled={availableCoins === 0}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40",
                    useCoins ? "bg-[#C98A24]" : "bg-[#061A13]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                      useCoins ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* WhatsApp Switch */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#061A13] border border-white/10 flex items-center justify-center shrink-0 text-[#4ADE80]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F5F3EC]">Order Updates</p>
                    <p className="text-xs font-bold text-[#AAB8B0]">Real-time alerts via WhatsApp</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWhatsappOptIn(!whatsappOptIn)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    whatsappOptIn ? "bg-[#C98A24]" : "bg-[#061A13]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                      whatsappOptIn ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Delivery Info Banner */}
            <div className="p-6 bg-[#10291F] rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#061A13] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F5F3EC]">Consolidated Delivery</p>
                  <p className="text-xs text-[#AAB8B0]">Expected: {format(expectedDate, "eeee, dd MMM")}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#4ADE80] bg-[#061A13] px-3 py-1 rounded-full border border-white/10">
                Free
              </span>
            </div>
          </div>

          {/* Premium Payable Summary Card */}
          <div className="lg:col-span-5 bg-[#061A13] rounded-2xl p-6 text-[#F5F3EC] flex flex-col justify-between border border-white/10 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#AAB8B0]">
                <span>Summary</span>
                <span>Step 3 of 3</span>
              </div>

              <div className="pt-2 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#AAB8B0] uppercase tracking-wider">Payable Total</span>
                <span className="text-4xl font-black text-[#C98A24]">
                  ₹{totalAmount.toFixed(0)}
                </span>
              </div>

              {coinsApplied > 0 && (
                <div className="flex justify-between items-center text-[#C98A24] pt-2 text-xs font-bold">
                  <span>Coins Discount ({coinsApplied} Coins)</span>
                  <span>- ₹{coinsToRupees(coinsApplied).toFixed(0)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <div className="w-7 h-7 rounded-full bg-[#10291F] border border-white/10 flex items-center justify-center shrink-0">
                <img src="/favicon.png" className="w-4 h-4 object-cover rounded-full" alt="Coin" />
              </div>
              <span className="text-xs font-bold text-[#AAB8B0]">
                You will earn <span className="text-sm font-black text-[#C98A24]">+{predictedCoinsEarned}</span> coins
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 md:mt-8 pt-4">
          <CircularBackButton
            onClick={onBack}
            className="w-12 h-12 rounded-full border-white/10 bg-[#10291F] hover:bg-[#164431] transition-colors shrink-0 text-[#F5F3EC]"
          />

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !razorpayLoaded}
            className="flex-1 h-14 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center transition-all hover:-translate-y-0.5"
          >
            {isProcessing ? "Processing Order..." : "Proceed to Pay & Confirm"}
          </Button>
        </div>

      </div>
    </div>
  );
}
