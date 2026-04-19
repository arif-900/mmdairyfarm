import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type OrderStatus =
  | Database["public"]["Enums"]["order_status"]
  | "picked_up"
  | "out_for_delivery";

interface OrderStatusBadgeProps {
  status?: OrderStatus | string | null;
  refundId?: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100/50 text-amber-700 border-amber-200/50",
  },
  paid: {
    label: "Paid",
    className: "bg-sky-100/50 text-sky-700 border-sky-200/50",
  },
  processing: {
    label: "Processing",
    className: "bg-purple-100/50 text-purple-700 border-purple-200/50",
  },
  picked_up: {
    label: "Picked Up",
    className: "bg-indigo-100/50 text-indigo-700 border-indigo-200/50",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "bg-orange-100/50 text-orange-700 border-orange-200/50",
  },
  shipped: {
    label: "Shipped",
    className: "bg-cyan-100/50 text-cyan-700 border-cyan-200/50",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-100/50 text-emerald-700 border-emerald-200/50",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-100/50 text-rose-700 border-rose-200/50",
  },
  refunded: {
    label: "Refunded",
    className: "bg-blue-100/50 text-blue-700 border-blue-200/50",
  },
};

export const OrderStatusBadge = ({ status, refundId }: OrderStatusBadgeProps) => {
  // Normalize status safely
  const normalizedStatus =
    typeof status === "string" ? status.toLowerCase() : "unknown";

  const effectiveStatus = (normalizedStatus === 'cancelled' && refundId) ? 'refunded' : normalizedStatus;

  const config = statusConfig[effectiveStatus] ?? {
    label:
      effectiveStatus === "unknown"
        ? "Unknown"
        : effectiveStatus
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()),
    className: "bg-slate-100/50 text-slate-700 border-slate-200/50",
  };

  return (
    <Badge 
        variant="outline" 
        className={`px-3 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm ${config.className}`}
    >
      {config.label}
    </Badge>
  );
};
