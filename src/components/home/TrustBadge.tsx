import { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TrustBadge = ({ icon: Icon, title, description }: TrustBadgeProps) => {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200/80 shadow-soft transition-all duration-300 hover:shadow-card hover:border-emerald-800/30 dark:bg-slate-900 dark:border-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
        <Icon className="w-6 h-6 text-emerald-800 dark:text-emerald-300" />
      </div>
      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
};

export default TrustBadge;

