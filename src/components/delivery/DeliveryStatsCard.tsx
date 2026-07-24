import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DeliveryStatsCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "slate" | "emerald" | "amber";
  className?: string;
}

const variants = {
  primary: "bg-forest text-white shadow-forest/20",
  slate: "bg-earth text-white shadow-earth/20",
  emerald: "bg-forest-light text-white shadow-forest-light/20",
  amber: "bg-golden text-white shadow-golden/20",
};

const iconBackgrounds = {
  primary: "bg-white/10 border-white/10 text-white",
  slate: "bg-white/10 border-white/10 text-forest",
  emerald: "bg-white/10 border-white/10 text-white",
  amber: "bg-white/10 border-white/10 text-white",
};

export function DeliveryStatsCard({ 
  title, 
  value, 
  label, 
  icon: Icon, 
  variant = "primary", 
  className 
}: DeliveryStatsCardProps) {
  return (
    <div 
      className={cn(
        "relative group overflow-hidden rounded-[10px] p-3 md:p-6 transition-all duration-500 shadow-lg md:shadow-xl active:scale-95 hover:shadow-2xl",
        variants[variant],
        className
      )}
    >
      {/* Decorative Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -top-4 -right-4 w-20 md:w-24 h-20 md:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10 space-y-2 md:space-y-3">
        <div 
          className={cn(
            "w-8 h-8 md:w-10 md:h-10 backdrop-blur-md rounded-[10px] flex items-center justify-center border",
            iconBackgrounds[variant]
          )}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] font-black opacity-60 uppercase tracking-[0.15em] md:tracking-[0.2em] mb-0.5 md:mb-1 truncate">{title}</p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0">
            <p className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight md:tracking-tighter tabular-nums truncate leading-none">{value}</p>
            <span className="text-[9px] md:text-xs font-bold opacity-80 truncate">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
