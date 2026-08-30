import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Loader2, Package, ShoppingBag, User, MapPin, Phone, CreditCard, Calendar, Bike, Printer, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ShippingLabelModal } from "./ShippingLabelModal";
import { RefreshCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("pending");
  const [staffList, setStaffList] = useState<{ user_id: string; full_name: string; phone?: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isShippingLabelOpen, setIsShippingLabelOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status as OrderStatus);
      fetchOrderItems();
    }
    checkAdminAndFetchStaff();
  }, [order]);

  const checkAdminAndFetchStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const userIsAdmin = profile?.role === "admin";
      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        const { data: staffData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("role", ["delivery", "staff"]);

        setStaffList(
          (staffData || []).map((s) => ({
            user_id: s.id,
            full_name: s.full_name || "Staff Member",
            phone: s.phone || undefined,
          }))
        );
      }
    } catch (err) {
      console.error("Error checking role/staff:", err);
    }
  };

  const fetchOrderItems = async () => {
    if (!order) return;
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          price_at_order,
          product_name,
          selected_weight,
          unit_type,
          variant_label
        `)
        .eq("order_id", order.id);

      if (error) {
        console.error("Error fetching order items:", error);
        setFetchError(error.message);
        toast({
          title: "Notice",
          description: "Could not load line items.",
          variant: "destructive",
        });
      } else {
        const formattedItems = (data || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price_at_order: item.price_at_order,
          product_name: item.product_name || "Dairy Product",
          selected_weight: item.selected_weight,
          unit_type: item.unit_type,
          variant_label: item.variant_label,
        }));
        setItems(formattedItems);
      }
    } catch (err: any) {
      console.error("Error in fetchOrderItems:", err);
      setFetchError(err?.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus.replace(/_/g, " ")}`,
      });
      onStatusUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignStaff = async (staffUserId: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const assignId = staffUserId === "unassigned" ? null : staffUserId;
      const { error } = await supabase
        .from("orders")
        .update({ assigned_to: assignId })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Rider Assigned",
        description: assignId ? "Order successfully assigned to delivery boy." : "Order unassigned.",
      });
      onStatusUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to permanently delete this order?")) return;

    setUpdating(true);
    try {
      const { error: itemsErr } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      if (itemsErr) console.warn("Items delete warning:", itemsErr);

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order Deleted",
        description: "Order removed permanently.",
      });
      onOpenChange(false);
      onStatusUpdate();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelAndRefund = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to cancel this order and refund ₹${order.total_amount} to the customer's wallet?`)) {
      return;
    }

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            reason: "Cancelled by Admin",
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to process refund");
      }

      toast({
        title: "Order Cancelled & Refunded",
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

  // Determine if payment was completed via Wallet / Coins
  const isWalletPayment = 
    (order as any).payment_method === 'wallet' || 
    (order as any).payment_method === 'coins' || 
    (Number(order.total_amount) === 0 && Number((order as any).coins_used || 0) > 0) ||
    Number(order.total_amount) === 0;

  const paymentMethodLabel = isWalletPayment 
    ? "PAID VIA WALLET" 
    : ((order as any).payment_method === 'cod' ? "CASH ON DELIVERY" : "PAID ONLINE (RAZORPAY)");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border border-white/10 bg-[#0B2118] text-[#F5F3EC] shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-6 md:p-8 border-b border-white/10 relative overflow-hidden bg-[#061A13]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C98A24]/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#10291F] rounded-2xl flex items-center justify-center border border-white/10 shadow-inner text-[#C98A24]">
                <Package className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-2xl md:text-3xl font-black text-[#F5F3EC] uppercase tracking-tight font-display">
                  Order <span className="text-[#C98A24] text-xl ml-1">#{order.id.slice(0, 8).toUpperCase()}</span>
                </h2>
                <div className="flex items-center gap-2 text-[#AAB8B0] font-bold text-[10px] uppercase tracking-[0.2em]">
                  <Calendar className="h-3 w-3 text-[#C98A24]" />
                  {format(new Date(order.created_at), "PPP · p")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsShippingLabelOpen(true)} 
                className="gap-2 rounded-xl h-10 border-white/10 bg-[#10291F] text-[#F5F3EC] hover:bg-white/10 font-black uppercase text-[10px] tracking-widest"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-[#C98A24]" />}
                Shipping Label
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information Card */}
            <div className="bg-[#10291F] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <User className="h-10 w-10 text-[#C98A24]" />
              </div>
              <h3 className="font-black text-[#F5F3EC] uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                <User className="h-3.5 w-3.5 text-[#C98A24]" />
                Customer Data
              </h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex items-center gap-3 bg-[#061A13] p-3 rounded-xl border border-white/10">
                  <div className="p-1.5 bg-[#10291F] rounded-lg text-[#C98A24]">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-black tracking-tight text-[#F5F3EC]">{order.user_name || "Customer"}</span>
                </div>
                <div className="flex items-center gap-3 bg-[#061A13] p-3 rounded-xl border border-white/10">
                  <div className="p-1.5 bg-[#10291F] rounded-lg text-[#C98A24]">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-black tracking-tight text-[#F5F3EC]">{order.phone}</span>
                </div>
                <div className="flex items-start gap-3 bg-[#061A13] p-3 rounded-xl border border-white/10">
                  <div className="p-1.5 bg-[#10291F] rounded-lg text-[#C98A24] mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-bold text-[#AAB8B0] text-xs leading-relaxed">{order.shipping_address}</span>
                </div>
                
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 font-black uppercase text-[9px] tracking-widest border-white/10 bg-[#061A13] text-[#F5F3EC] hover:bg-white/10" asChild>
                    <a href={`tel:${order.phone}`}>Call</a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 font-black uppercase text-[9px] tracking-widest border-white/10 bg-[#061A13] text-[#F5F3EC] hover:bg-white/10" asChild>
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
            <div className="bg-[#10291F] border border-white/10 rounded-2xl p-5 shadow-xl relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                {isWalletPayment ? <Wallet className="h-10 w-10 text-[#C98A24]" /> : <CreditCard className="h-10 w-10 text-[#C98A24]" />}
              </div>
              <h3 className="font-black text-[#F5F3EC] uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                {isWalletPayment ? <Wallet className="h-3.5 w-3.5 text-[#C98A24]" /> : <CreditCard className="h-3.5 w-3.5 text-[#C98A24]" />}
                Txn Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest">Status:</span>
                  <OrderStatusBadge status={order.status} refundId={(order as any).refund_id} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-widest">Method:</span>
                  <Badge className={cn(
                    "uppercase text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full border",
                    isWalletPayment ? "bg-[#C98A24]/15 text-[#C98A24] border-[#C98A24]/30" : "bg-[#3BC77B]/15 text-[#3BC77B] border-[#3BC77B]/30"
                  )}>
                    {paymentMethodLabel}
                  </Badge>
                </div>
                {((order as any).razorpay_payment_id || (order as any).refund_id) && (
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5">
                    {(order as any).razorpay_payment_id && (
                      <p className="text-[9px] font-bold text-[#AAB8B0] flex items-center gap-1.5 overflow-hidden text-ellipsis">
                        <span className="text-[#3BC77B] opacity-80">ID:</span>
                        {(order as any).razorpay_payment_id}
                      </p>
                    )}
                    {(order as any).refund_id && (
                      <div className="flex items-center gap-2 mt-1 p-2 bg.blue-950/40 rounded-xl border border-blue-500/30">
                        <RefreshCcw className="h-3 w-3 text-blue-400" />
                        <span className="text-[9px] font-black text-blue-300 uppercase tracking-tighter">
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
            <h3 className="font-black text-[#F5F3EC] uppercase text-xs tracking-widest flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-[#C98A24]" />
              Itemized Manifest
            </h3>
            {loading ? (
              <div className="flex justify-center py-8 bg-[#10291F] rounded-2xl border border-white/10">
                <Loader2 className="h-8 w-8 animate-spin text-[#C98A24]" />
              </div>
            ) : fetchError ? (
              <div className="border border-red-500/30 bg-red-950/40 rounded-2xl p-4 text-red-300 text-xs font-bold uppercase tracking-tight">
                Error sync: {fetchError}
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.id} className="p-4 bg-[#10291F] rounded-2xl flex justify-between items-center border border-white/10 shadow-xl group hover:border-white/20 transition-all">
                    <div className="flex-1">
                      <p className="font-black text-[#F5F3EC] text-sm uppercase tracking-tight">{item.product_name || "Product"}</p>
                      <p className="text-[10px] text-[#AAB8B0] font-bold mt-0.5 uppercase tracking-widest">
                        {item.variant_label || (item.selected_weight && item.unit_type) ? (
                          <span className="text-[#3BC77B] mr-2 px-1.5 py-0.5 bg-[#061A13] rounded border border-white/10">
                            {item.variant_label || `${item.selected_weight}${item.unit_type}`}
                          </span>
                        ) : null}
                        Qty: {item.quantity} · Rate: ₹{Number(item.price_at_order).toFixed(0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#C98A24] text-base">
                        ₹{(Number(item.quantity) * Number(item.price_at_order)).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#10291F] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-black text-[#F5F3EC] uppercase text-xs tracking-widest flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 text-[#C98A24]" />
              Order Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#AAB8B0] uppercase tracking-tight">
                <span>Items Subtotal</span>
                <span className="text-[#F5F3EC]">₹{(Number(order.total_amount) - Number(order.shipping_fee || 0) + Number((order as any).discount_amount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#AAB8B0] uppercase tracking-tight">
                <span>Delivery Logistics</span>
                <span className="text-[#F5F3EC]">₹{Number(order.shipping_fee || 0).toFixed(2)}</span>
              </div>
              {!!(order as any).discount_amount && Number((order as any).discount_amount) > 0 && (
                <div className="flex items-center justify-between text-xs font-black text-[#3BC77B] uppercase tracking-tight">
                  <span>Loyalty Discount</span>
                  <span>-₹{Number((order as any).discount_amount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                   <p className="text-[10px] text-[#AAB8B0] font-black uppercase tracking-[0.2em] mb-1">Total Payable</p>
                   <p className="text-4xl font-black text-[#C98A24] tracking-tighter">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className={cn(
                     "text-[10px] font-black uppercase px-3 py-1 rounded-full border",
                     isWalletPayment ? "bg-[#C98A24]/15 text-[#C98A24] border-[#C98A24]/30" : "bg-[#3BC77B]/15 text-[#3BC77B] border-[#3BC77B]/30"
                   )}>
                     {paymentMethodLabel}
                   </span>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-[#10291F] rounded-2xl p-5 space-y-3 border border-white/10">
               <div className="flex items-center justify-between">
                 <h3 className="font-semibold text-sm text-[#F5F3EC] flex items-center gap-2">
                   <Bike className="h-4 w-4 text-[#C98A24]" />
                   Assign Delivery Boy
                 </h3>
                 {order.assigned_to === null && (
                   <span className="text-xs text-[#AAB8B0]">Select a delivery boy below</span>
                 )}
               </div>
               {staffList.length === 0 ? (
                 <p className="text-xs text-[#AAB8B0] italic">No delivery boys available. Create accounts in the Delivery Boys tab.</p>
               ) : (
                <div className="flex gap-2">
                  <Select
                     value={order.assigned_to || "unassigned"}
                     onValueChange={handleAssignStaff}
                     disabled={updating}
                  >
                     <SelectTrigger className="flex-1 h-11 rounded-xl bg-[#061A13] border-white/10 text-[#F5F3EC] font-bold text-xs">
                         <SelectValue placeholder="Select Delivery Boy" />
                     </SelectTrigger>
                     <SelectContent className="bg-[#10291F] border-white/10 text-[#F5F3EC]">
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

          <div className="bg-[#10291F] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-[#F5F3EC] uppercase text-xs tracking-widest flex items-center gap-2">
              <RefreshCcw className="h-3.5 w-3.5 text-[#C98A24]" />
              Lifecycle Management
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as OrderStatus)}
              >
                <SelectTrigger className="flex-1 h-12 rounded-xl bg-[#061A13] border-white/10 font-bold text-sm text-[#F5F3EC]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#10291F] border-white/10 text-[#F5F3EC]">
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="font-bold text-xs uppercase tracking-widest">
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleStatusChange(selectedStatus)}
                disabled={updating || selectedStatus === order.status}
                className="h-12 px-6 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase text-xs tracking-widest shadow-xl"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Status"}
              </Button>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAndRefund}
                  disabled={updating || order.status === "cancelled"}
                  className="rounded-xl h-10 border-amber-500/30 text-amber-300 bg-amber-950/20 hover:bg-amber-500 hover:text-black font-black uppercase text-[10px] tracking-widest"
                >
                  {order.payment_method === 'online' ? "Cancel & Trigger Refund" : "Abort Order"}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteOrder}
                  disabled={updating}
                  className="rounded-xl h-10 bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white font-black uppercase text-[10px] tracking-widest gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <ShippingLabelModal
        order={order}
        open={isShippingLabelOpen}
        onOpenChange={setIsShippingLabelOpen}
      />
    </Dialog>
  );
};
