import { MapPin, ArrowRight, AlertCircle, Truck, Info } from "lucide-react";
import { CircularBackButton } from "../ui/CircularBackButton";
import { Button } from "@/components/ui/button";
import AddressSelector from "@/components/order/AddressSelector";
import { cn } from "@/lib/utils";

interface DeliveryStepProps {
  user: any;
  selectedAddress: any;
  setSelectedAddress: (addr: any) => void;
  setIsTemporaryAddress: (val: boolean) => void;
  authLoading: boolean;
  distance: number | null;
  distanceError: string | null;
  shippingFee: number;
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
  onNext,
  onBack,
  navigate
}: DeliveryStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <MapPin className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Delivery Address</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Where should we drop off your freshness?</p>
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
                <div className="flex items-center gap-3 p-6 bg-orange-50 border border-orange-100 rounded-[32px] animate-pulse">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <p className="text-sm font-black text-orange-700 uppercase italic">Please select an address from the list above</p>
                </div>
              )}

              {selectedAddress && (
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shipping Summary</p>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black text-slate-800">
                          {shippingFee === 0 ? "Free Delivery" : `₹${shippingFee} Shipping Fee`}
                        </p>
                      </div>
                    </div>
                    {distance !== null && (
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Distance</p>
                        <p className="text-sm font-black text-slate-800 italic">{distance.toFixed(1)} km away</p>
                      </div>
                    )}
                  </div>
                  
                  {distanceError && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-black text-rose-700 uppercase leading-relaxed">{distanceError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
              <p className="font-black text-sm text-slate-400 uppercase tracking-widest mb-6 italic">Sign in to complete your delivery info</p>
              <Button onClick={() => navigate("/auth?redirect=/order")} className="rounded-2xl h-14 px-12 font-black uppercase text-sm tracking-widest">Sign In Now</Button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <CircularBackButton 
            onClick={onBack}
            className="w-16 h-16"
          />
          
          {selectedAddress && (
            <Button 
              onClick={onNext}
              disabled={!!distanceError}
              className="flex-[2] h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 group active:scale-95 transition-all flex items-center justify-between px-8"
            >
              <span className="font-black tracking-widest">Continue to Payment</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
