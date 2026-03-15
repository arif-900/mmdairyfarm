import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"] | 'picked_up' | 'out_for_delivery';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  paid: { label: "Paid", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  processing: { label: "Processing", className: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  picked_up: { label: "Picked Up", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  shipped: { label: "Shipped", className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  delivered: { label: "Delivered", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = statusConfig[status] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '), 
    className: "bg-slate-500/10 text-slate-600 border-slate-500/30" 
  };
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
