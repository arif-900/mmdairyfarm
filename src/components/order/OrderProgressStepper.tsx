import React from "react";
import { CheckCircle2, Package, Truck, ShoppingBag, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderProgressStepperProps {
  status: string;
  className?: string;
}

const steps = [
  { key: "placed", label: "Placed", icon: ShoppingBag },
  { key: "confirmed", label: "Confirmed", icon: ShieldCheck },
  { key: "processing", label: "Preparing", icon: Package },
  { key: "shipped", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export const OrderProgressStepper: React.FC<OrderProgressStepperProps> = ({ status, className }) => {
  const getActiveIndex = (st: string) => {
    switch (st?.toLowerCase()) {
      case "pending":
      case "placed":
        return 0;
      case "paid":
      case "confirmed":
        return 1;
      case "processing":
        return 2;
      case "shipped":
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveIndex(status);

  if (status?.toLowerCase() === "cancelled") {
    return (
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span>Order Cancelled</span>
        <span className="text-[10px] text-rose-300 font-medium">Refund / Action Processed</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-[#0B2118] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl text-[#F5F3EC]", className)}>
      {/* DESKTOP HORIZONTAL STEPPER */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between relative mb-2">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-[#10291F] z-0">
            <div
              className="h-full bg-[#C98A24] transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, (activeIndex / (steps.length - 1)) * 100)}%`,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group">
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 font-bold shadow-md",
                    isCompleted
                      ? "bg-[#0F8A5F] text-[#F5F3EC]"
                      : isCurrent
                      ? "bg-[#C98A24] text-[#061A13] ring-4 ring-[#C98A24]/30 scale-110 shadow-[0_0_20px_rgba(201,138,36,0.5)]"
                      : "bg-[#10291F] text-[#718078] border border-white/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider mt-3 text-center leading-tight transition-colors",
                    isCurrent
                      ? "text-[#C98A24] font-black"
                      : isCompleted
                      ? "text-[#F5F3EC]"
                      : "text-[#718078]"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE VERTICAL STEPPER */}
      <div className="sm:hidden space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAB8B0]">Delivery Journey</p>
        <div className="space-y-3.5 pl-2 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.key} className="relative flex items-center gap-3.5">
                {!isLast && (
                  <div 
                    className={cn(
                      "absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px]",
                      isCompleted ? "bg-[#0F8A5F]" : "bg-white/10"
                    )}
                  />
                )}

                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all font-bold",
                    isCompleted
                      ? "bg-[#0F8A5F] text-[#F5F3EC]"
                      : isCurrent
                      ? "bg-[#C98A24] text-[#061A13] ring-2 ring-[#C98A24]/40 scale-105"
                      : "bg-[#10291F] text-[#718078] border border-white/10"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs uppercase tracking-wider font-bold",
                    isCurrent ? "text-[#C98A24] font-black text-sm" : isCompleted ? "text-[#F5F3EC]" : "text-[#718078]"
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
