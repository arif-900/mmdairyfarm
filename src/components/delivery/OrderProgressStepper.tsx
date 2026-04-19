import { CheckCircle2, Circle, Truck, Package, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "processing" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";

interface OrderProgressStepperProps {
  status: OrderStatus;
  className?: string;
}

const steps = [
  { id: "pending", label: "Queued", icon: Clock },
  { id: "processing", label: "Preparing", icon: Package },
  { id: "picked_up", label: "Picked Up", icon: Truck },
  { id: "out_for_delivery", label: "On Way", icon: Navigation },
  { id: "delivered", label: "Done", icon: CheckCircle2 },
];

export function OrderProgressStepper({ status, className }: OrderProgressStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === status);
  if (status === "cancelled") return null;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  isCompleted 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                )}
              </div>
              <span 
                className={cn(
                  "absolute top-10 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-500",
                  isCompleted ? "text-primary" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
