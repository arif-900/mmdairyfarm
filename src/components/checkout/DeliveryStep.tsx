import { MapPin, ArrowRight, AlertCircle, Truck, Info, Sparkles } from "lucide-react";
import { CircularBackButton } from "../ui/CircularBackButton";
import { Button } from "@/components/ui/button";
import AddressSelector from "@/components/order/AddressSelector";
import { calculateDeliveryFeeDetails } from "@/utils/distance";
import { FreeDeliveryCelebration } from "./FreeDeliveryCelebration";

interface DeliveryStepProps {
  user: any;
  selectedAddress: any;
  setSelectedAddress: (addr: any) => void;
  setIsTemporaryAddress: (val: boolean) => void;
  authLoading: boolean;
  distance: number | null;
  distanceError: string | null;
  shippingFee: number;
  subtotal?: number;
  onNext: () => void;
  onBack: () => void;
  navigate: (path: string) => void;
}

export function DeliveryStep({
  user,
  selectedAddress,
  setSelectedAddress,
  setIsTemporaryAddress,
  authLoading,
  distance,
  distanceError,
  shippingFee,
  subtotal = 0,
  onNext,
  onBack,
  navigate
}: DeliveryStepProps) {
  const deliveryDetails = calculateDeliveryFeeDetails(distance, subtotal);
  const isFree = deliveryDetails.isFreeDelivery;

  return (
    <div className="space-y-6 font-body text-[#F5F3EC]">
      <div className="bg-[#0B2118] rounded-[24px] md:rounded-[40px] p-5 md:p-8 shadow-2xl border border-white/10">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-[#F5F3EC] uppercase tracking-tight">Delivery Address</h2>
            <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest">Where should we drop off your freshness?</p>
          </div>
        </div>

        <div className="space-y-8">
          {user ? (
            <div className="space-y-6">
              <AddressSelector
                userId={user.id}
                selectedId={selectedAddress?.id}
                onSelect={(addr) => setSelectedAddress(addr)}
                onTemporaryAddress={setIsTemporaryAddress}
              />
              
              {!selectedAddress && !authLoading && (
                <div className="flex items-center gap-3 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-[#C98A24]" />
                  <p className="text-xs font-bold text-[#F5F3EC] uppercase">Please select an address from the list above</p>
                </div>
              )}

              {selectedAddress && (
                <div className="space-y-4">
                  {/* Celebration Trigger (Fires in Step 2 if subtotal < 1000 and within free distance zone) */}
                  <FreeDeliveryCelebration 
                    isFreeDelivery={isFree && subtotal < 1000 && !distanceError} 
                    reason={deliveryDetails.freeDeliveryReason}
                    distanceKm={distance}
                  />

                  <div className="p-4 md:p-6 bg-[#10291F] rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAB8B0] mb-1">Shipping Summary</p>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#C98A24]" />
                          <p className="text-sm font-black text-[#F5F3EC]">
                            {isFree ? (
                              <span className="text-[#3BC77B] flex items-center gap-1">
                                FREE DELIVERY <Sparkles className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              `₹${shippingFee} Shipping Fee`
                            )}
                          </p>
                        </div>
                      </div>
                      {distance !== null && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAB8B0] mb-1">Distance</p>
                          <p className="text-sm font-black text-[#C98A24]">{distance.toFixed(1)} km away</p>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator to unlock Free Delivery if order < 1000 and distance > 10 */}
                    {!isFree && deliveryDetails.amountNeededForFreeDelivery > 0 && !distanceError && (
                      <div className="p-3 bg-[#0B2118] rounded-xl border border-[#C98A24]/20 flex items-center justify-between text-xs">
                        <span className="text-[#AAB8B0] flex items-center gap-1.5 font-medium">
                          <Info className="w-4 h-4 text-[#C98A24] shrink-0" />
                          Add <strong className="text-[#F5F3EC]">₹{deliveryDetails.amountNeededForFreeDelivery}</strong> more for FREE DELIVERY
                        </span>
                      </div>
                    )}
                    
                    {distanceError && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-rose-300 uppercase leading-relaxed">{distanceError}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#10291F] rounded-3xl border border-white/10">
              <p className="font-bold text-sm text-[#AAB8B0] uppercase tracking-widest mb-6">Sign in to complete your delivery info</p>
              <Button onClick={() => navigate("/auth?redirect=/order")} className="rounded-xl h-12 px-8 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-bold uppercase text-xs tracking-widest">Sign In Now</Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8 md:mt-10">
          <CircularBackButton 
            onClick={onBack}
            className="w-12 h-12 shrink-0"
          />
          
          <Button 
            onClick={onNext}
            disabled={!selectedAddress || !!distanceError}
            className="flex-1 h-14 md:h-16 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] disabled:opacity-50 text-[#061A13] font-black uppercase tracking-widest shadow-xl flex items-center justify-between px-6 transition-all hover:-translate-y-0.5"
          >
            <span className="font-black tracking-widest text-xs md:text-sm">Continue to Payment</span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
