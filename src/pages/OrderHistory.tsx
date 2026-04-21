import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, ArrowLeft, ShoppingBag, CreditCard, Banknote, RefreshCw, Coins } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackForm } from "@/components/checkout/FeedbackForm";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";
import { BillModal } from "@/components/order/BillModal";
import { Download, Truck } from "lucide-react";
import { getDeliveryMessage } from "@/utils/delivery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
  selected_weight?: number;
  unit_type?: string;
  variant_label?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
  delivery_type: string;
  shipping_address: string;
  payment_method: string;
  phone: string;
  order_items: OrderItem[];
  customer_name?: string;
  razorpay_payment_id?: string;
  expected_delivery_date?: string | null;
  order_delivery_days?: number | null;
  shipping_fee?: number | null;
  coins_used?: number;
  coins_earned?: number;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const fetchOrders = async (showRefreshing = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    else setIsLoading(true);

    try {
      // Fetch profile safely using maybeSingle to avoid 406 errors for new users
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`*`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      console.log("Orders data fetched:", ordersData?.length || 0, "orders found");

      if (ordersData && ordersData.length > 0) {
        // Filter out orders that are stuck in 'pending' with 'online' payment method
        // These are typically failed or abandoned checkouts
        const validOrdersData = ordersData.filter(o => 
          !(o.status === 'pending' && o.payment_method === 'online')
        );

        if (validOrdersData.length > 0) {
          const orderIds = validOrdersData.map(o => o.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("id, order_id, product_name, quantity, price_at_order, selected_weight, unit_type, variant_label")
            .in("order_id", orderIds);

          if (itemsError) {
            console.error("Error fetching order items:", itemsError);
            throw itemsError;
          }

          // Fetch delivery partner profiles for assigned orders
          const assignedIds = validOrdersData.filter((o: any) => o.assigned_to).map((o: any) => o.assigned_to);
          const { data: profilesData } = assignedIds.length > 0 
            ? await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", assignedIds)
            : { data: [] };

          const ordersWithItems = validOrdersData.map((order: any) => {
            const items = (itemsData || []).filter(item => item.order_id === order.id);
            const deliveryPartner = (profilesData || []).find(p => p.user_id === order.assigned_to);
            return {
              ...order,
              customer_name: profile?.full_name || user.user_metadata?.full_name || "Valued Customer",
              order_items: items,
              delivery_partner: deliveryPartner
            };
          });

          setOrders(ordersWithItems);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    if (!authLoading) {
      fetchOrders();

      // Subscribe to real-time updates for user's orders
      if (user) {
        const channel = supabase
          .channel(`user-orders-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("Order status updated:", payload);
              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === payload.new.id
                    ? { ...order, status: payload.new.status }
                    : order
                )
              );
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user, authLoading]);

  const handleOpenBill = (order: Order) => {
    setSelectedOrderForBill(order);
    setIsBillModalOpen(true);
  };

  const handleResumePayment = async (order: Order) => {
    if (!razorpayLoaded) {
      toast.error("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: Math.round(order.total_amount * 100),
          currency: "INR",
          receipt: order.id,
          notes: { order_id: order.id }
        }
      });

      if (error) throw error;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SPbCCCt7wrjMwy",
        amount: data.amount,
        currency: data.currency,
        name: "MMVALI Dairy Farm",
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
        order_id: data.id,
        handler: async (response: RazorpayResponse) => {
          const { error: verifyError } = await supabase.functions.invoke("verify-payment", {
            body: {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order.id,
            },
          });

          if (verifyError) {
            toast.error("Payment verification failed. Please contact support.");
          } else {
            toast.success("Payment successful! Your order is now confirmed.");
            fetchOrders(true); // Refresh
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || "",
          email: user?.email || "",
          contact: (user as any)?.phone || "",
        },
        notes: {
          order_id: order.id,
        },
        theme: { color: "#16a34a" },
        modal: {
          ondismiss: () => setIsProcessing(null)
        }
      };


      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Resume payment error:", err);
      toast.error("Could not initialize payment. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { orderId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      toast.success(data.message || "Order cancelled successfully");
      fetchOrders(true);
    } catch (err: any) {
      console.error("Cancellation error:", err);
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancellingOrder(null);
    }
  };


  if (authLoading) {
    return (
      <Layout>
        <div className="container-main section-padding">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container-main section-padding">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view orders</h2>
              <p className="text-muted-foreground mb-6">
                Please log in to view your order history and track deliveries.
              </p>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-main">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Orders</h1>
            <Button
              variant="outline"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-primary-foreground/80">
            Track your orders and view delivery status
          </p>
        </div>
      </section>

      {/* Orders List */}
      <section className="section-padding">
        <div className="container-main max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't placed any orders yet. Start shopping for fresh dairy products!
                </p>
                <Button asChild>
                  <Link to="/order">Place Your First Order</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const config = statusConfig[order.status] || { 
                  label: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown", 
                  variant: "default" 
                };
                return (
                  <Card key={order.id} className="relative overflow-hidden border-none shadow-2xl rounded-[40px] bg-white group hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-opacity group-hover:opacity-100 opacity-60" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100/30 rounded-full -ml-16 -mb-16 blur-2xl" />

                    <CardContent className="p-8 space-y-8 relative">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                              <Package className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Order Ref</p>
                              <h3 className="text-xl font-black tracking-tighter text-slate-900 font-mono">#{order.id.slice(0, 8).toUpperCase()}</h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 pt-1">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">{format(new Date(order.created_at), "PPP · p")}</span>
                            </div>
                            {(() => {
                              const msg = getDeliveryMessage(order.expected_delivery_date, order.status);
                              if (!msg) return null;
                              const isDelivered = msg.startsWith("✅");
                              const isCancelled = msg.startsWith("❌");
                              const isToday = msg.includes("Today");
                              return (
                                <div className={cn(
                                  "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                  isCancelled ? "bg-rose-50 text-rose-600 border-rose-100" :
                                  isDelivered ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  isToday ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" :
                                  "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                  <Truck className="w-3 h-3" />
                                  {msg}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 self-stretch sm:self-auto">
                          <div className="flex items-center gap-2">
                             {(['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm hover:border-primary hover:text-primary font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95"
                                onClick={() => handleOpenBill(order)}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Bill
                              </Button>
                            )}
                             <Badge className={cn(
                                "h-10 px-5 rounded-xl border-none shadow-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center",
                                order.status === 'pending' ? "bg-slate-100 text-slate-500 shadow-slate-100/40" :
                                order.status === 'cancelled' ? "bg-rose-500 text-white shadow-rose-500/20" :
                                "bg-primary text-white shadow-primary/20"
                             )}>
                               {config.label}
                             </Badge>
                          </div>

                           {/* Cancel Button for Customer */}
                           {['pending', 'paid', 'processing'].includes(order.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-[0.15em] gap-1.5"
                                  disabled={cancellingOrder === order.id}
                                >
                                  {cancellingOrder === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter text-slate-900">
                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                      <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    Cancel Order?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-500 font-medium pt-2">
                                    Are you sure you want to cancel this order? This action cannot be undone.
                                    {order.payment_method === 'online' && order.status !== 'pending' && (
                                      <div className="mt-4 p-4 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-amber-900 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                                        Note: A full refund will be initiated automatically.
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-3 pt-4">
                                  <AlertDialogCancel className="rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest border-slate-200">Keep Order</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="rounded-2xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20"
                                  >
                                    Yes, Cancel Order
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Products</p>
                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50 space-y-4">
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center group/item">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm group-hover/item:border-primary/20 transition-colors">
                                    {item.quantity}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-slate-900 tracking-tight">
                                      {item.product_name || "Product"}
                                      {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                                        <span className="ml-1.5 text-primary opacity-80 text-[0.85em]">
                                          ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Rate: ₹{Number(item.price_at_order).toFixed(0)}</p>
                                  </div>
                                </div>
                                <p className="font-black text-slate-900 tracking-tight text-lg">
                                  ₹{(item.price_at_order * item.quantity).toFixed(0)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-xs font-bold text-slate-400 italic">No details found</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Delivery & Payment Info */}
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Type</p>
                                <p className="font-bold text-slate-800 tracking-tight leading-none pt-1">
                                  {order.delivery_type === "daily" ? "Daily Sub" : "One-time"}
                                </p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Method</p>
                                <div className="flex items-center gap-2 pt-1">
                                  {order.payment_method === "cod" ? <Banknote className="w-3.5 h-3.5 text-amber-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
                                  <p className="font-bold text-slate-800 tracking-tight uppercase text-xs">
                                    {order.payment_method === "cod" ? "Cash" : "Online"}
                                  </p>
                                </div>
                             </div>
                           </div>

                           <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               <MapPin className="w-3 h-3" />
                               Destination Address
                             </p>
                             <p className="text-[11px] font-bold text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               {order.shipping_address}
                             </p>
                           </div>

                             {/* Delivery Partner Info */}
                            {(order as any).delivery_partner && (
                              <div className="p-4 bg-primary/5 rounded-[28px] border-2 border-dashed border-primary/10 transition-all hover:bg-primary/[0.07]">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                      <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent On Duty</p>
                                      <p className="font-black text-slate-900 tracking-tight">{(order as any).delivery_partner.full_name}</p>
                                      <a href={`tel:${(order as any).delivery_partner.phone}`} className="text-xs font-black text-primary hover:underline flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Call Partner
                                      </a>
                                    </div>
                                  </div>
                                  {(order.status as string) === 'out_for_delivery' && (order as any).delivery_otp && (order as any).payment_method !== 'cod' && (
                                    <div className="text-right bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Verify ID</p>
                                      <p className="text-xl font-black text-primary tracking-[0.2em] font-mono leading-none">{(order as any).delivery_otp}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="flex flex-col justify-end">
                           <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-4 shadow-2xl shadow-slate-900/20">
                              <div className="space-y-2 border-b border-white/5 pb-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Subtotal</span>
                                  <span className="text-white">₹{(order.total_amount + (order.coins_used || 0) - (order.shipping_fee || 0)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Shipping</span>
                                  <span className="text-white">₹{(order.shipping_fee || 0).toFixed(0)}</span>
                                </div>
                                {(order.coins_used || 0) > 0 && (
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-amber-400">
                                    <span>Discount Used</span>
                                    <span>-₹{(order.coins_used || 0).toFixed(0)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Paid</p>
                                  <p className="text-4xl font-black tracking-tighter leading-none">
                                    ₹{order.total_amount.toFixed(0)}
                                  </p>
                                </div>
                                
                                {(order.coins_earned || 0) > 0 && (
                                  <div className="flex flex-col items-end gap-2 group/coins scale-90 origin-bottom-right">
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-amber-400 blur-lg opacity-40 group-hover/coins:opacity-70 transition-opacity" />
                                        <div className="relative px-3 py-2 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
                                          <div className="w-5 h-5 rounded-full bg-amber-400 p-0.5 relative overflow-hidden ring-2 ring-amber-400/20">
                                              <img src="/favicon.png" className="w-full h-full object-cover rounded-full" alt="Coin" />
                                          </div>
                                          <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                                              {order.status === 'delivered' ? 'Earned ' : 'Expected '} 
                                              {order.coins_earned}
                                          </span>
                                        </div>
                                      </div>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Payment Prompt */}
                      {order.status === 'pending' && order.payment_method === 'online' && (
                        <div className="animate-in slide-in-from-top-4 duration-500">
                          <Button
                            onClick={() => handleResumePayment(order)}
                            disabled={isProcessing === order.id}
                            className="w-full h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-sm tracking-[0.2em] shadow-2xl shadow-primary/20 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all uppercase"
                          >
                            {isProcessing === order.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-3 animate-spin" />
                                INITIALIZING GATEWAY...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-3" />
                                RE-ATTEMPT PAYMENT
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Feedback Form */}
                      {order.status === 'delivered' && (
                        <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Rate Your Masterpiece</p>
                          <FeedbackForm orderId={order.id} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <BillModal 
        order={selectedOrderForBill} 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
      />
    </Layout>
  );
};

export default OrderHistory;
