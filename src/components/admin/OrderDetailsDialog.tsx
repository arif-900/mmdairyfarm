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
import { Loader2, Package, User, MapPin, Phone, CreditCard, Calendar, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  assigned_to?: string | null;
  is_cash_collected?: boolean;
};
type OrderStatus = Database["public"]["Enums"]["order_status"] | 'picked_up' | 'out_for_delivery';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
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
      const { error } = await supabase
        .from("orders")
        .update({ status: selectedStatus } as any)
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order status changed to ${selectedStatus}`,
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

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(order.created_at), "PPpp")}
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.shipping_address}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`tel:${order.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`tel:+91XXXXXXXXXX`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </a>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Payment:</span>
                {order.payment_method === 'cod' ? (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100">
                    💵 Cash on Delivery
                  </Badge>
                ) : order.payment_method === 'online' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-100">
                    ✅ Paid Online
                  </Badge>
                ) : (
                  <span className="font-semibold capitalize">{order.payment_method || "N/A"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Products</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fetchError ? (
              <div className="border border-red-300 bg-red-50 rounded-lg p-4 text-red-700 text-sm">
                Error loading items: {fetchError}
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-base">{item.product_name || "Product"}</p>
                      <p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">Price: ₹{Number(item.price_at_order).toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-lg text-primary ml-4">
                      ₹{(Number(item.quantity) * Number(item.price_at_order)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold">Total Amount</span>
              </div>
              <span className="text-2xl font-bold text-primary">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
            {order.payment_method === 'cod' && (
              <div className="mt-4 flex items-center justify-between p-3 bg-amber-50 rounded-md border border-amber-200">
                <div className="text-sm font-medium text-amber-900">💵 Cash Collected?</div>
                <Button 
                  variant={order.is_cash_collected ? "default" : "outline"} 
                  size="sm"
                  onClick={handleToggleCashCollected}
                  disabled={updating}
                  className={order.is_cash_collected ? "bg-emerald-600 hover:bg-emerald-700" : "border-amber-400 text-amber-700 hover:bg-amber-50"}
                >
                  {order.is_cash_collected ? "✓ Collected" : "Not Yet"}
                </Button>
              </div>
            )}
            {order.payment_method === 'online' && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-md border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">✅ Online Payment Received — No cash collection needed</p>
              </div>
            )}
            {(order.payment_intent_id || (order as any).razorpay_payment_id) && (
              <div className="mt-3 pt-3 border-t border-primary/10 space-y-1">
                {(order as any).razorpay_payment_id && (
                  <p className="text-[10px] text-emerald-600 font-medium">Payment ID: {(order as any).razorpay_payment_id}</p>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="bg-blue-50/50 rounded-lg p-4 space-y-3 border border-blue-100">
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

          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Update Status</h3>
            <div className="flex gap-3">
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as OrderStatus)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStatusUpdate} disabled={updating || selectedStatus === order.status}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
