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
  primary: "bg-primary text-white shadow-primary/20",
  slate: "bg-slate-900 text-white shadow-slate-900/20",
  emerald: "bg-emerald-600 text-white shadow-emerald-500/20",
  amber: "bg-amber-500 text-white shadow-amber-500/20",
};

const iconBackgrounds = {
  primary: "bg-white/10 border-white/10 text-white",
  slate: "bg-white/10 border-white/10 text-primary",
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
        "relative group overflow-hidden rounded-[32px] p-6 transition-all duration-500 shadow-xl active:scale-95 hover:shadow-2xl",
        variants[variant],
        className
      )}
    >
      {/* Decorative Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10 space-y-3">
        <div 
          className={cn(
            "w-10 h-10 backdrop-blur-md rounded-2xl flex items-center justify-center border",
            iconBackgrounds[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums">{value}</p>
            <span className="text-xs font-bold opacity-80">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
