import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Package, ShoppingBag, User, MapPin, Map as MapIcon, Phone, CreditCard, Calendar, Bike, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ShippingLabelModal } from "./ShippingLabelModal";
import { AlertCircle, RefreshCcw, Trash2 } from "lucide-react";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  assigned_to?: string | null;
  is_cash_collected?: boolean;
  is_cash_settled?: boolean;
  cash_settled_at?: string | null;
};
type OrderStatus = Database["public"]["Enums"]["order_status"] | 'picked_up' | 'out_for_delivery';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
  selected_weight?: number;
  unit_type?: string;
  variant_label?: string;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "picked_up",
  "out_for_delivery",
  "shipped",
  "delivered",
  "cancelled",
];

export const OrderDetailsDialog = ({
  order,
  open,
  onOpenChange,
  onStatusUpdate,
}: OrderDetailsDialogProps) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isShippingLabelOpen, setIsShippingLabelOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      fetchOrderItems();
      checkAdminStatus();
      fetchStaff();
    }
  }, [order]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        setIsAdmin(data?.role === 'admin' || data?.role === 'staff');
    }
  };

  const fetchStaff = async () => {
    try {
        const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'delivery_boy' as any);

        if (rolesError) {
            console.error("OrderDetailsDialog: Error fetching user_roles:", rolesError);
            setStaffList([]);
            return;
        }

        if (!rolesData || rolesData.length === 0) {
            setStaffList([]);
            return;
        }

        const deliveryBoyIds = new Set(rolesData.map(r => r.user_id));
        
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .order('full_name');

        if (profilesError) {
            console.error("OrderDetailsDialog: Error fetching profiles:", profilesError);
            setStaffList([]);
            return;
        }

        if (profilesData) {
            const validDeliveryBoys = profilesData.filter(p => deliveryBoyIds.has(p.user_id));
            setStaffList(validDeliveryBoys);
        } else {
            setStaffList([]);
        }
    } catch (err) {
        console.error("OrderDetailsDialog: Unknown fetchStaff error:", err);
        setStaffList([]);
    }
  };

  const fetchOrderItems = async () => {
    if (!order) return;
    setLoading(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching order items:", err);
      setFetchError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return;
    setUpdating(true);

    try {
      // ─── WhatsApp Service DISABLED ───────────────────────────────────────
      // To re-enable, uncomment the block below and remove the direct Supabase update.
      //
      // const serviceUrl = "/api/orders/status";
      // const response = await fetch(serviceUrl, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ orderId: order.id, status: selectedStatus }),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error || "Failed to update status");
      // }
      // ─────────────────────────────────────────────────────────────────────

      // Direct Supabase update (WhatsApp service bypassed)
      const { error } = await supabase
        .from("orders")
        .update({ status: selectedStatus } as any)
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order status changed to ${selectedStatus}.`,
      });

      onStatusUpdate();
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Update Failed",
        description: "Could not update order status",
        variant: "destructive",
      });
      setSelectedStatus(order.status);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleCashCollected = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const newValue = !order.is_cash_collected;
      const { error } = await supabase
        .from("orders")
        .update({ is_cash_collected: newValue } as any)
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "COD Updated",
        description: newValue ? "Cash marked as collected" : "Cash marked as not collected",
      });
      onStatusUpdate();
    } catch (err) {
      console.error("Error updating cash collection:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ assigned_to: staffId === "unassigned" ? null : staffId } as any)
        .eq('id', order.id);
      
      if (error) throw error;
      toast({ title: "Order Assigned", description: "Successfully assigned to staff member." });
      onStatusUpdate();
    } catch (err) {
      console.error("Error assigning staff:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    
    const confirmRefund = window.confirm(
        `Are you sure you want to cancel this order and refund ₹${order.total_amount} to the customer's Milk Wallet (Coins)?`
    );
    if (!confirmRefund) return;

    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc("refund_order_to_wallet", {
        p_order_id: order.id
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result.success) throw new Error(result.message);

      toast({
        title: "Refund Processed",
        description: `₹${result.refunded_amount} credited to customer wallet successfully.`,
      });
      onStatusUpdate();
    } catch (err: any) {
      console.error("Refund error:", err);
      toast({
        title: "Refund Failed",
        description: err.message || "Could not process wallet refund",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-cream shadow-elevated">
        <DialogHeader className="p-8 border-b border-forest/10 relative overflow-hidden bg-white/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-forest/10 rounded-[10px] flex items-center justify-center border border-forest/20 shadow-inner">
                <Package className="h-8 w-8 text-forest" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-forest uppercase tracking-tight font-display">
                  Order <span className="text-golden-dark text-xl ml-1">#{order.id.slice(0, 8).toUpperCase()}</span>
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(order.created_at), "PPP · p")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsShippingLabelOpen(true)} 
                className="gap-2 rounded-[10px] h-10 border-forest/10 font-black uppercase text-[10px] tracking-widest hover:bg-forest/5"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Shipping Label
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information Card */}
            <div className="bg-white/40 border border-forest/10 rounded-[10px] p-5 shadow-soft relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <User className="h-10 w-10 text-forest" />
              </div>
              <h3 className="font-black text-forest uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                <User className="h-3 w-3" />
                Customer Data
              </h3>
              <div className="space-y-4 text-sm relative z-10">
                <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-[10px] border border-white/50">
                  <div className="p-1.5 bg-forest/10 rounded-[10px] text-forest">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="font-black tracking-tight">{order.user_name || "Customer"}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-[10px] border border-white/50">
                  <div className="p-1.5 bg-forest/10 rounded-[10px] text-forest">
                    <Phone className="h-3 w-3" />
                  </div>
                  <span className="font-black tracking-tight">{order.phone}</span>
                </div>
                <div className="flex items-start gap-3 bg-white/60 p-2.5 rounded-[10px] border border-white/50">
                  <div className="p-1.5 bg-forest/10 rounded-[10px] text-forest mt-0.5">
                    <MapPin className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-gray-700 leading-tight">{order.shipping_address}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-[10px] h-9 font-black uppercase text-[9px] tracking-widest border-forest/10 hover:bg-forest/5" asChild>
                    <a href={`tel:${order.phone}`}>Call</a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-[10px] h-9 font-black uppercase text-[9px] tracking-widest border-forest/10 hover:bg-forest/5" asChild>
                    <a 
                      href={order.shipping_lat && order.shipping_lng ? `https://www.google.com/maps?q=${order.shipping_lat},${order.shipping_lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shipping_address || "")}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      Locate
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment & Status Card */}
            <div className="bg-white/40 border border-forest/10 rounded-[10px] p-5 shadow-soft relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <CreditCard className="h-10 w-10 text-golden" />
              </div>
              <h3 className="font-black text-forest uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                <CreditCard className="h-3 w-3" />
                Txn Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status:</span>
                  <OrderStatusBadge status={order.status} refundId={(order as any).refund_id} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method:</span>
                  {order.payment_method === 'cod' ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200/50 uppercase text-[9px] font-black tracking-widest">
                      Cash/COD
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 uppercase text-[9px] font-black tracking-widest">
                      Paid Online
                    </Badge>
                  )}
                </div>
                {((order as any).razorpay_payment_id || (order as any).refund_id) && (
                  <div className="pt-3 border-t border-forest/5 flex flex-col gap-1.5">
                    {(order as any).razorpay_payment_id && (
                      <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5 overflow-hidden text-ellipsis">
                        <span className="text-emerald-600 opacity-60">ID:</span>
                        {(order as any).razorpay_payment_id}
                      </p>
                    )}
                    {(order as any).refund_id && (
                      <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50/50 rounded-[10px] border border-blue-100">
                        <RefreshCcw className="h-3 w-3 text-blue-600" />
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">
                          Refunded: {(order as any).refund_id}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-forest uppercase text-xs tracking-widest flex items-center gap-2">
              <Package className="h-3 w-3" />
              Itemized Manifest
            </h3>
            {loading ? (
              <div className="flex justify-center py-8 bg-white/30 rounded-[10px] border border-forest/5">
                <Loader2 className="h-8 w-8 animate-spin text-forest/40" />
              </div>
            ) : fetchError ? (
              <div className="border border-red-200 bg-red-50/50 rounded-[10px] p-4 text-red-700 text-xs font-bold uppercase tracking-tight">
                Error sync: {fetchError}
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.id} className="p-4 bg-white/60 backdrop-blur-sm rounded-[10px] flex justify-between items-center border border-white/80 shadow-soft group hover:border-forest/20 transition-all">
                    <div className="flex-1">
                      <p className="font-black text-forest text-sm uppercase tracking-tight">{item.product_name || "Product"}</p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-widest">
                        {item.variant_label || (item.selected_weight && item.unit_type) ? (
                          <span className="text-forest mr-2 px-1.5 py-0.5 bg-forest/5 rounded border border-forest/10">
                            {item.variant_label || `${item.selected_weight}${item.unit_type}`}
                          </span>
                        ) : null}
                        Qty: {item.quantity} · Rate: ₹{Number(item.price_at_order).toFixed(0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-forest text-base">
                        ₹{(Number(item.quantity) * Number(item.price_at_order)).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/40 border border-forest/10 rounded-[10px] p-6 shadow-soft space-y-4">
            <h3 className="font-black text-forest uppercase text-xs tracking-widest flex items-center gap-2">
              <ShoppingBag className="h-3 w-3" />
              Order Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                <span>Items Subtotal</span>
                <span>₹{(Number(order.total_amount) - Number(order.shipping_fee || 0) + Number((order as any).discount_amount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                <span>Delivery Logistics</span>
                <span>₹{Number(order.shipping_fee || 0).toFixed(2)}</span>
              </div>
              {!!(order as any).discount_amount && Number((order as any).discount_amount) > 0 && (
                <div className="flex items-center justify-between text-xs font-black text-emerald-600 uppercase tracking-tight">
                  <span>Loyalty Discount</span>
                  <span>-₹{Number((order as any).discount_amount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-4 border-t border-forest/10 flex items-end justify-between">
                <div>
                   <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Total Payable</p>
                   <p className="text-4xl font-black text-forest tracking-tighter">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                   {order.payment_method === 'cod' ? (
                    <div className="flex flex-col items-end gap-2">
                       <div className="flex flex-col items-end gap-1">
                          <span className={`${order.is_cash_collected ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'} text-[10px] font-black uppercase px-2 py-0.5 rounded-full border`}>
                            {order.is_cash_collected ? 'Collected' : 'Pending Collection'}
                          </span>
                          {order.is_cash_collected && (
                            <span className={`${order.is_cash_settled ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-rose-600 bg-rose-50 border-rose-100'} text-[10px] font-black uppercase px-2 py-0.5 rounded-full border`}>
                              {order.is_cash_settled ? 'Settled with Office' : 'Wait for Handover'}
                            </span>
                          )}
                       </div>
                       <Button 
                        variant={order.is_cash_collected ? "default" : "outline"} 
                        size="sm"
                        onClick={handleToggleCashCollected}
                        disabled={updating}
                        className={order.is_cash_collected ? "bg-emerald-600 hover:bg-emerald-700 h-9 rounded-[10px] px-4" : "border-amber-400 text-amber-700 hover:bg-amber-50 h-9 rounded-[10px] px-4 font-black text-[9px] uppercase tracking-widest"}
                      >
                        {order.is_cash_collected ? "✓ Collected" : "Mark Collected"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Settled Online</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-blue-50/50 rounded-[10px] p-4 space-y-3 border border-blue-100">
               <div className="flex items-center justify-between">
                 <h3 className="font-semibold flex items-center gap-2">
                   <Bike className="h-4 w-4 text-blue-600" />
                   Assign Delivery Boy
                 </h3>
                 {order.assigned_to === null && (
                   <span className="text-xs text-muted-foreground">Select a delivery boy below</span>
                 )}
               </div>
               {staffList.length === 0 ? (
                 <p className="text-sm text-muted-foreground italic">No delivery boys available. Create accounts in the Delivery Boys tab.</p>
               ) : (
               <div className="flex gap-2">
                 <Select
                    value={order.assigned_to || "unassigned"}
                    onValueChange={handleAssignStaff}
                    disabled={updating}
                 >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Delivery Boy" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">— Unassigned —</SelectItem>
                        {staffList.map(item => (
                            <SelectItem key={item.user_id} value={item.user_id}>
                                🛵 {item.full_name}{item.phone ? ` · ${item.phone}` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
               </div>
               )}
            </div>
          )}

          <div className="bg-forest/5 border border-forest/10 rounded-[10px] p-6 space-y-4">
            <h3 className="font-black text-forest uppercase text-xs tracking-widest flex items-center gap-2">
              <RefreshCcw className="h-3 w-3" />
              Lifecycle Management
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as OrderStatus)}
              >
                <SelectTrigger className="flex-1 h-12 rounded-[10px] bg-white border-forest/10 font-bold text-sm text-forest">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-forest/10">
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="font-bold text-xs uppercase tracking-widest">
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStatusUpdate} 
                className="h-12 px-8 rounded-[10px] bg-forest hover:bg-forest-dark text-white font-black uppercase text-[10px] tracking-widest transition-all"
                disabled={updating || selectedStatus === order.status}
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Status"}
              </Button>
            </div>
            
            {isAdmin && order.status !== 'cancelled' && ['pending', 'paid', 'processing'].includes(order.status) && (
              <Button 
                variant="outline" 
                className="w-full h-11 rounded-[10px] gap-2 font-black uppercase text-[9px] tracking-[0.2em] border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-none" 
                onClick={handleRefund}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {order.payment_method === 'online' ? "Cancel & Trigger Refund" : "Abort Order"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      {order && (
         <ShippingLabelModal
           order={{ ...order, order_items: items } as any}
           isOpen={isShippingLabelOpen}
           onClose={() => setIsShippingLabelOpen(false)}
         />
      )}
    </Dialog>
  );
};
