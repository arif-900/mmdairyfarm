import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, ArrowLeft, ShoppingBag, CreditCard, Banknote, RefreshCw } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
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
            .select("id, order_id, product_name, quantity, price_at_order")
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
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-secondary/30">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(order.created_at), "PPP 'at' p")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
                              onClick={() => handleOpenBill(order)}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Bill
                            </Button>
                          )}
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {/* Order Items */}
                      <div className="space-y-2 mb-4">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center py-2 border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium text-foreground">{item.product_name || "Product"}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium text-foreground">
                                ₹{(item.price_at_order * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            No product details available
                          </div>
                        )}
                      </div>

                      {/* Order Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t border-border">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {order.delivery_type === "daily" ? "Daily Subscription" : "One-time Delivery"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-muted">
                              {order.payment_method === "cod" ? (
                                <>
                                  <Banknote className="w-3 h-3" />
                                  COD
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-3 h-3" />
                                  Online
                                </>
                              )}
                            </span>
                          </div>
                        <p className="truncate max-w-[250px]">{order.shipping_address}</p>
                        
                        {/* Delivery Partner & OTP Info */}
                        {(order as any).delivery_partner && (
                          <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Partner</p>
                                  <p className="font-bold text-sm text-slate-900">{(order as any).delivery_partner.full_name}</p>
                                  <a href={`tel:${(order as any).delivery_partner.phone}`} className="text-xs font-black text-primary hover:underline">
                                    📞 {(order as any).delivery_partner.phone}
                                  </a>
                                </div>
                              </div>
                              {(order.status as string) === 'out_for_delivery' && (order as any).delivery_otp && (
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Code</p>
                                  <p className="text-xl font-black text-primary tracking-widest">{(order as any).delivery_otp}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-bold text-primary">
                          Total: ₹{order.total_amount.toFixed(2)}
                        </p>
                      </div>

                      {/* Payment Action for Pending Online Orders */}
                      {order.status === 'pending' && order.payment_method === 'online' && (
                        <div className="mt-4 pt-4 border-t border-border flex justify-end">
                          <Button
                            onClick={() => handleResumePayment(order)}
                            disabled={isProcessing === order.id}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isProcessing === order.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Complete Payment
                              </>
                            )}
                          </Button>
                        </div>
                      )}


                      {order.status === 'delivered' && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-semibold mb-3">Rate your delivery</h4>
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
