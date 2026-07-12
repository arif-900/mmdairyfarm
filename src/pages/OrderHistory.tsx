import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Clock, RefreshCw, ShoppingBag, CreditCard, Banknote, Truck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";
import { getDeliveryMessage } from "@/utils/delivery";
import { cn } from "@/lib/utils";
import { CircularBackButton } from "@/components/ui/CircularBackButton";

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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchOrders = async (showRefreshing = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    else setIsLoading(true);

    try {
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

      if (ordersData && ordersData.length > 0) {
        const validOrdersData = ordersData.filter(o => 
          !(o.status === 'pending' && o.payment_method === 'online')
        );

        if (validOrdersData.length > 0) {
          const orderIds = validOrdersData.map(o => o.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("id, order_id, product_name, quantity, price_at_order, selected_weight, unit_type, variant_label")
            .in("order_id", orderIds);

          if (itemsError) throw itemsError;

          const ordersWithItems = validOrdersData.map((order: any) => {
            const items = (itemsData || []).filter(item => item.order_id === order.id);
            return {
              ...order,
              customer_name: profile?.full_name || user.user_metadata?.full_name || "Valued Customer",
              order_items: items,
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
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    if (!authLoading) {
      fetchOrders();

      if (user) {
        const channel = supabase
          .channel(`user-orders-list-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
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
            fetchOrders(true);
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
              <h2 className="text-2xl font-bold text-foreground mb-2 font-display">Sign in to view orders</h2>
              <p className="text-muted-foreground mb-6 font-body">
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
          <CircularBackButton 
            onClick={() => navigate("/")} 
            className="mb-8"
          />
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Orders</h1>
            <Button
              variant="outline"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="flex items-center gap-2 border-white/20 text-white bg-white/10 hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-primary-foreground/80 font-body">
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
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="text-center border-none shadow-soft rounded-2xl bg-white p-8">
              <CardContent className="pt-12 pb-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2 font-display">No orders yet</h2>
                <p className="text-muted-foreground mb-6 font-body">
                  You haven't placed any orders yet. Start shopping for fresh dairy products!
                </p>
                <Button asChild>
                  <Link to="/order">Place Your First Order</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {orders.map((order) => {
                const config = statusConfig[order.status] || { 
                  label: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown", 
                  variant: "default" 
                };

                const totalItems = order.order_items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <Card key={order.id} className="relative overflow-hidden border border-border bg-white rounded-2xl shadow-soft hover:shadow-card">
                    <CardContent className="p-6 md:p-8 space-y-6 relative font-body">
                      
                      {/* Top Info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Ref</p>
                            <h3 className="text-lg font-bold text-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</h3>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn(
                            "px-3 py-1 rounded-full border-none text-[10px] font-bold uppercase tracking-wider",
                            order.status === 'pending' ? "bg-slate-100 text-slate-600" :
                            order.status === 'cancelled' ? "bg-rose-500 text-white" :
                            "bg-primary text-white"
                          )}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Middle summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-y border-border/60 text-sm">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Date</p>
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Items</p>
                          <p className="text-foreground font-semibold">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Payment</p>
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            {order.payment_method === "cod" ? <Banknote className="w-3.5 h-3.5 text-amber-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
                            <span className="uppercase text-xs">{order.payment_method === "cod" ? "Cash" : "Online"}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Total Amount</p>
                          <p className="text-foreground font-bold text-base">₹{order.total_amount.toFixed(0)}</p>
                        </div>
                      </div>

                      {/* Expected delivery / action button */}
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
                        {(() => {
                          const msg = getDeliveryMessage(order.expected_delivery_date, order.status);
                          if (!msg) return <div />;
                          const isDelivered = msg.startsWith("✅");
                          const isCancelled = msg.startsWith("❌");
                          const isToday = msg.includes("Today");
                          return (
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border self-start",
                              isCancelled ? "bg-rose-50 text-rose-600 border-rose-100" :
                              isDelivered ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              isToday ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                              <Truck className="w-3 h-3" />
                              {msg}
                            </div>
                          );
                        })()}

                        <div className="flex flex-col sm:flex-row gap-3">
                          {order.status === 'pending' && order.payment_method === 'online' && (
                            <Button
                              onClick={() => handleResumePayment(order)}
                              disabled={isProcessing === order.id}
                              size="sm"
                              className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider"
                            >
                              {isProcessing === order.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Pay Now"
                              )}
                            </Button>
                          )}
                          
                          <Button 
                            asChild 
                            variant="default"
                            size="sm"
                            className="h-10 px-5 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5"
                          >
                            <Link to={`/orders/${order.id}`}>
                              View Details
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default OrderHistory;
