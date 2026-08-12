import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Package, Clock, ArrowLeft, CreditCard, Banknote, RefreshCw, MapPin, Truck, Download, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackForm } from "@/components/checkout/FeedbackForm";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";
import { BillModal } from "@/components/order/BillModal";
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
import { cn } from "@/lib/utils";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { OrderProgressStepper } from "@/components/order/OrderProgressStepper";

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
  assigned_to?: string | null;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const fetchOrderDetail = async () => {
    if (!user || !id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch profile safely using maybeSingle
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`*`)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (orderError) throw orderError;

      if (orderData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, product_name, quantity, price_at_order, selected_weight, unit_type, variant_label")
          .eq("order_id", id);

        if (itemsError) throw itemsError;

        let deliveryPartner = null;
        if (orderData.assigned_to) {
          const { data: partnerData } = await supabase
            .from("profiles")
            .select("user_id, full_name, phone")
            .eq("user_id", orderData.assigned_to)
            .maybeSingle();
          deliveryPartner = partnerData;
        }

        setOrder({
          ...orderData,
          customer_name: profile?.full_name || user.user_metadata?.full_name || "Valued Customer",
          order_items: itemsData || [],
          delivery_partner: deliveryPartner
        } as any);
      }
    } catch (error) {
      console.error("Error fetching order detail:", error);
      toast.error("Could not load order details.");
      navigate("/orders");
    } finally {
      setIsLoading(false);
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
      fetchOrderDetail();

      if (user && id) {
        // Subscribe to real-time updates for this specific order
        const channel = supabase
          .channel(`user-order-detail-${id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `id=eq.${id}`,
            },
            (payload) => {
              setOrder((prevOrder) => {
                if (!prevOrder) return null;
                return {
                  ...prevOrder,
                  status: payload.new.status,
                };
              });
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
  }, [id, user, authLoading]);

  const handleResumePayment = async () => {
    if (!order) return;
    if (!razorpayLoaded) {
      toast.error("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);
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
            fetchOrderDetail(); // Refresh page
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
          ondismiss: () => setIsProcessing(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Resume payment error:", err);
      toast.error("Could not initialize payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancellingOrder(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { orderId: order.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      toast.success(data.message || "Order cancelled successfully");
      fetchOrderDetail();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancellingOrder(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container-main section-padding">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !order) {
    return (
      <Layout>
        <div className="container-main section-padding text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't retrieve the details of the requested order.
          </p>
          <Button asChild>
            <Link to="/orders">Back to Orders</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const config = statusConfig[order.status] || { 
    label: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown", 
    variant: "default" 
  };

  return (
    <Layout>
      <section className="bg-[#061A13] min-h-screen text-[#F5F3EC] py-6 sm:py-10 px-4 font-sans">
        <div className="max-w-[1150px] mx-auto space-y-6 sm:space-y-8">
          
          {/* 1. COMPACT PAGE HERO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <CircularBackButton 
                onClick={() => navigate("/orders")} 
                className="border-white/10 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F]"
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C98A24]">Order Overview</span>
                <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F5F3EC] tracking-tight">
                  ORDER <span className="text-[#C98A24]">DETAILS</span>
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right pl-12 sm:pl-0">
              <p className="font-mono font-black text-[#C98A24] text-base sm:text-lg">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-[#AAB8B0] font-medium mt-0.5">
                Placed {format(new Date(order.created_at), "PPP · p")}
              </p>
            </div>
          </div>

          {/* TWO-COLUMN DESKTOP / SINGLE-COLUMN MOBILE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* LEFT COLUMN (Desktop 7 cols): Status, Progress Stepper, Items */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 2. CURRENT STATUS HERO CARD (Focal Point) */}
              <div className="bg-[#0B2118] border border-white/10 border-t-2 border-t-[#C98A24] rounded-2xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#AAB8B0]">Current Status</span>
                  <Badge className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border-none shadow-sm",
                    order.status === 'pending' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    order.status === 'cancelled' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                    "bg-[#0F8A5F]/20 text-[#0F8A5F] border border-[#0F8A5F]/30"
                  )}>
                    {config.label}
                  </Badge>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24] shadow-md">
                    {order.status === 'delivered' ? <CheckCircle2 className="w-6 h-6" /> :
                     order.status === 'cancelled' ? <AlertTriangle className="w-6 h-6 text-rose-400" /> :
                     order.status === 'shipped' ? <Truck className="w-6 h-6" /> :
                     <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#F5F3EC] uppercase tracking-tight">
                      {order.status === 'delivered' ? "Order Delivered" :
                       order.status === 'cancelled' ? "Order Cancelled" :
                       order.status === 'shipped' ? "Out for Delivery" :
                       order.status === 'processing' ? "Preparing Fresh Supply" :
                       "Order Confirmed"}
                    </h3>
                    <p className="text-xs text-[#AAB8B0] leading-relaxed mt-1">
                      {order.status === 'delivered' ? "Your farm-fresh dairy items have been delivered safely." :
                       order.status === 'cancelled' ? "This order was cancelled. Any processed payment will be refunded." :
                       order.status === 'shipped' ? "Your order is out for delivery with our rider and on its way to you." :
                       order.status === 'processing' ? "Our farm team is packaging your organic dairy items with care." :
                       "Your order is confirmed and scheduled for preparation."}
                    </p>
                  </div>
                </div>

                {/* Delivery ETA pill */}
                {(() => {
                  const msg = getDeliveryMessage(order.expected_delivery_date, order.status);
                  if (!msg) return null;
                  return (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[#AAB8B0] font-medium flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#C98A24]" /> Estimated Arrival:
                      </span>
                      <span className="font-extrabold text-[#C98A24] uppercase tracking-wider">{msg}</span>
                    </div>
                  );
                })()}
              </div>

              {/* 3. ORDER PROGRESS STEPPER */}
              <div>
                <OrderProgressStepper status={order.status} />
              </div>

              {/* 5. YOUR ITEMS SECTION */}
              <div className="bg-[#0B2118] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F3EC]">
                    YOUR ITEMS <span className="text-[#C98A24] ml-1">({order.order_items?.length || 0})</span>
                  </h3>
                  <span className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-wider">Farm Fresh</span>
                </div>

                <div className="divide-y divide-white/10 space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item) => (
                      <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          {/* Dedicated 12px rounded image frame */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#F1EEE7] border border-white/10 flex items-center justify-center p-2 shrink-0 shadow-sm">
                            <Package className="w-8 h-8 text-[#123B2A] opacity-40" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-extrabold text-[#F5F3EC] text-sm sm:text-base tracking-tight truncate">
                              {item.product_name || "Product"}
                            </p>
                            {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                              <p className="text-xs font-medium text-[#AAB8B0] mt-0.5">
                                Variant: {item.variant_label || `${item.selected_weight}${item.unit_type}`}
                              </p>
                            )}
                            <p className="text-xs text-[#AAB8B0] mt-1 font-medium">
                              Qty {item.quantity} • <span className="text-[#C98A24] font-bold">₹{Number(item.price_at_order).toFixed(0)}</span>
                            </p>
                          </div>
                        </div>

                        <p className="font-black text-[#C98A24] text-base sm:text-lg shrink-0">
                          ₹{(item.price_at_order * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#AAB8B0] italic py-3 text-center">No line items recorded</p>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (Desktop 5 cols): Order Summary, Delivery Details, Payment Summary, Actions */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 4. ORDER SUMMARY CARD */}
              <div className="bg-[#0B2118] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F3EC] pb-2 border-b border-white/10">
                  ORDER SUMMARY
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Order Ref</p>
                    <p className="font-mono font-bold text-[#C98A24] mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Order Date</p>
                    <p className="font-bold text-[#F5F3EC] mt-0.5">{format(new Date(order.created_at), "dd MMM, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Payment</p>
                    <p className="font-bold text-[#F5F3EC] uppercase mt-0.5 flex items-center gap-1.5">
                      {order.payment_method === "cod" ? <Banknote className="w-3.5 h-3.5 text-[#C98A24]" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                      {order.payment_method === "cod" ? "Cash" : "Online"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Delivery Type</p>
                    <p className="font-bold text-[#F5F3EC] capitalize mt-0.5">
                      {order.delivery_type === "daily" ? "Daily Sub" : "One-Time"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 8. DELIVERY DETAILS CARD */}
              <div className="bg-[#0B2118] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F3EC] pb-2 border-b border-white/10 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C98A24]" /> DELIVERY DETAILS
                </h3>

                <div className="bg-[#10291F] border border-white/10 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Destination Address</p>
                  <p className="text-xs font-medium text-[#F5F3EC] leading-relaxed">
                    {order.shipping_address}
                  </p>
                </div>

                {/* 9. DELIVERY AGENT / PARTNER */}
                {(order as any).delivery_partner ? (
                  <div className="p-4 bg-[#10291F] rounded-xl border border-white/10 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Delivery Partner</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#F5F3EC]">{(order as any).delivery_partner.full_name}</p>
                        <a href={`tel:${(order as any).delivery_partner.phone}`} className="text-xs font-bold text-[#C98A24] hover:underline flex items-center gap-1 mt-0.5">
                          Call Rider
                        </a>
                      </div>
                      {(order as any).delivery_otp && (
                        <div className="text-right bg-[#0B2118] px-3 py-1.5 rounded-lg border border-white/10">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#718078]">OTP</p>
                          <p className="text-base font-mono font-black text-[#C98A24]">{(order as any).delivery_otp}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#718078] italic">Delivery partner will be assigned soon.</p>
                )}
              </div>

              {/* 10. PAYMENT SUMMARY CARD (NO NAVY BLUE!) */}
              <div className="bg-[#0B2118] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F3EC] pb-2 border-b border-white/10">
                  PAYMENT SUMMARY
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#AAB8B0]">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#F5F3EC]">₹{(order.total_amount + (order.coins_used || 0) - (order.shipping_fee || 0)).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[#AAB8B0]">
                    <span>Shipping</span>
                    <span className="font-bold text-[#F5F3EC]">₹{(order.shipping_fee || 0).toFixed(0)}</span>
                  </div>
                  {(order.coins_used || 0) > 0 && (
                    <div className="flex justify-between text-[#C98A24]">
                      <span>Discount Used</span>
                      <span className="font-bold">-₹{(order.coins_used || 0).toFixed(0)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#718078]">Total Paid</p>
                    <p className="text-3xl font-black text-[#C98A24] leading-none mt-1">
                      ₹{order.total_amount.toFixed(0)}
                    </p>
                  </div>

                  <Badge className="bg-[#10291F] text-[#F5F3EC] border border-white/10 font-bold uppercase text-[10px] px-3 py-1">
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </Badge>
                </div>
              </div>

              {/* 14. PRIMARY ACTIONS & CANCEL ORDER */}
              <div className="space-y-3 pt-2">
                {/* Re-attempt payment button */}
                {order.status === 'pending' && order.payment_method === 'online' && (
                  <Button
                    onClick={handleResumePayment}
                    disabled={isProcessing}
                    className="w-full h-13 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-extrabold text-xs uppercase tracking-wider shadow-xl border border-[#C98A24]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Initializing Gateway...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Re-Attempt Payment
                      </>
                    )}
                  </Button>
                )}

                {/* Download Bill button */}
                {['paid', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                  <Button 
                    onClick={() => setIsBillModalOpen(true)}
                    className="w-full h-12 rounded-xl bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] hover:text-[#C98A24] border border-white/20 font-bold text-xs uppercase tracking-wider shadow-xl"
                  >
                    <Download className="w-4 h-4 mr-2 text-[#C98A24]" />
                    Download Invoice Bill
                  </Button>
                )}

                {/* Cancel Order near the bottom */}
                {['pending', 'paid', 'processing'].includes(order.status) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        disabled={cancellingOrder}
                        className="w-full h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs uppercase tracking-wider"
                      >
                        {cancellingOrder ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Cancel Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl bg-[#0B2118] text-[#F5F3EC] border border-white/10 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-xl font-black text-[#F5F3EC]">
                          <AlertTriangle className="w-6 h-6 text-rose-400" />
                          Cancel Order?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#AAB8B0] pt-2 leading-relaxed">
                          Are you sure you want to cancel order #{order.id.slice(0, 8).toUpperCase()}? This action cannot be undone.
                          {order.payment_method === 'online' && order.status !== 'pending' && (
                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] font-bold">
                              Note: A full refund will be initiated automatically.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 pt-4">
                        <AlertDialogCancel className="rounded-xl h-11 bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] border-white/10 font-bold text-xs uppercase">Keep Order</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelOrder}
                          className="rounded-xl h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase shadow-xl"
                        >
                          Yes, Cancel Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Feedback Form if delivered */}
              {order.status === 'delivered' && (
                <div className="bg-[#0B2118] border border-white/10 rounded-2xl p-5 shadow-2xl text-center space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#AAB8B0]">Rate Your Delivery Experience</p>
                  <FeedbackForm orderId={order.id} />
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      <BillModal 
        order={order} 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
      />
    </Layout>
  );
};

export default OrderDetail;
