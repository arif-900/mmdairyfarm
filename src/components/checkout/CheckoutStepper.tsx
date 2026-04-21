import { CheckCircle2, ChevronRight, ShoppingBag, MapPin, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: "Summary", icon: ShoppingBag },
  { id: 2, label: "Delivery", icon: MapPin },
  { id: 3, label: "Payment", icon: CreditCard },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index + 1 < currentStep;
          const isActive = index + 1 === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-4 group">
              <div className="flex items-center flex-col md:flex-row gap-3">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                    isCompleted 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : isActive
                        ? "bg-white border-primary text-primary shadow-xl shadow-slate-200 scale-110"
                        : "bg-white border-slate-200 text-slate-400 opacity-60"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                  )}
                </div>
                <div className="text-center md:text-left">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
                    isActive || isCompleted ? "text-slate-800" : "text-slate-400"
                  )}>
                    {step.label}
                  </p>
                  {isActive && (
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1 block">In Progress</span>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 opacity-20">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
