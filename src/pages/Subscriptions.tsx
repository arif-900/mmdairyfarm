import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useStoreProducts } from "@/data/products";
import {
  Loader2,
  CalendarRange,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Home,
  Calendar,
  ChevronRight,
  Package,
  AlertCircle,
  Truck,
  Wallet,
  CreditCard
} from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { calculatePrice, formatWeight } from "@/utils/pricing";
import { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";

const Subscriptions = () => {
  const { products, loading: productsLoading } = useStoreProducts();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // States
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [useCoins, setUseCoins] = useState(false);

  // Guided Flow State
  const productId = searchParams.get("productId");
  const isAddingConfig = searchParams.get("add-config") === "true";
  const selectedWeight = Number(searchParams.get("weight") || 1000);
  const unitType = (searchParams.get("unitType") as "g" | "ml") || "ml";
  const selectedQuantity = Number(searchParams.get("quantity") || 1);

  const [configProduct, setConfigProduct] = useState<any>(null);
  const [planType, setPlanType] = useState<string>("daily");
  const [deliveryTime, setDeliveryTime] = useState<string>("morning");
  const [startDate, setStartDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(addDays(new Date(), 31), "yyyy-MM-dd"));

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAddingConfig && productId && products.length > 0) {
      const prod = products.find(p => p.id === productId);
      if (prod) setConfigProduct(prod);
    }
  }, [isAddingConfig, productId, products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch existing subscriptions (Active and Paused)
      const { data: subs } = await supabase
        .from("subscription_items")
        .select("*, products(*), subscriptions(*)")
        .neq("status", "cancelled");

      setSubscriptions(subs || []);

      // Fetch addresses
      const { data: addrs } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user?.id);

      if (addrs) {
        setAddresses(addrs);
        const def = addrs.find(a => a.is_default) || addrs[0];
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDeliveries = () => {
    if (!endDate) return 30; // Estimate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;

    let count = 0;
    if (planType === 'daily') count = days;
    else if (planType === 'alternate') count = Math.ceil(days / 2);
    else if (planType === 'weekly') count = Math.ceil(days / 7);
    else if (planType === 'monthly') count = Math.ceil(days / 30);

    return deliveryTime === 'both' ? count * 2 : count;
  };

  const totalDeliveries = calculateTotalDeliveries();
  const basePrice = configProduct ? (configProduct.basePricePerKg || configProduct.price) : 0;
  const currentUnitPrice = calculatePrice(basePrice, selectedWeight);
  const rawTotalPrice = currentUnitPrice * selectedQuantity * totalDeliveries;

  // Wallet Logic
  const availableCoins = profile?.reward_coins || 0;
  const coinsToUse = useCoins ? Math.min(rawTotalPrice, availableCoins) : 0;
  const finalPayableTotal = Math.max(0, rawTotalPrice - coinsToUse);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const finalizeSubscription = async (paymentId?: string) => {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) throw new Error("Delivery address not found");

    const { data, error } = await supabase.rpc("activate_subscription_v2", {
      p_user_id: user?.id,
      p_address: addr.address_line,
      p_product_id: configProduct.id,
      p_quantity: selectedQuantity,
      p_selected_weight: selectedWeight,
      p_unit_type: unitType,
      p_plan_type: planType,
      p_delivery_time: deliveryTime,
      p_start_date: startDate,
      p_end_date: endDate,
      p_price_per_unit: currentUnitPrice,
      p_coins_used: coinsToUse
    });

    if (error) throw error;

    const result = data as any;
    if (!result.success) throw new Error(result.message);

    toast({
      title: "Subscription Started!",
      description: `₹${coinsToUse} coins used. Your daily farm fresh goodness is on the way.`
    });

    navigate("/subscription-success", {
      state: {
        product: configProduct,
        config: {
          frequency: planType,
          timing: deliveryTime,
          startDate,
          endDate,
          quantity: selectedQuantity,
          weight: selectedWeight,
          unitType
        },
        totalAmount: Math.round(finalPayableTotal),
        totalDeliveries
      }
    });
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    setProcessingId(id);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('subscription_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast({
        title: `Plan ${newStatus === 'active' ? 'Resumed' : 'Paused'}`,
        description: newStatus === 'active' ? "Your deliveries will resume tomorrow." : "Deliveries have been temporarily stopped."
      });
      fetchData();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const cancelSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to cancel? Any remaining balance will be automatically refunded to your wallet coins.")) return;

    setProcessingId(id);
    try {
      const { data, error } = await supabase.rpc('refund_subscription_to_wallet', {
        p_item_id: id
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Subscription Cancelled",
          description: `₹${data.refunded_amount} has been refunded to your wallet coins.`,
        });
      } else {
        toast({ title: "Error", description: data?.message || "Could not cancel", variant: "destructive" });
      }
      fetchData();
    } catch (err: any) {
      toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!selectedAddressId) {
      toast({ title: "Address Required", variant: "destructive" });
      return;
    }

    if (!endDate) {
      toast({ title: "Ending Date Required", description: "Please select an ending date.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 🚀 CASE 1: FULL WALLET PAYMENT (FREE)
      if (Math.round(finalPayableTotal) === 0) {
        await finalizeSubscription();
        return;
      }

      // 💳 CASE 2: PARTIAL OR FULL PAYMENT VIA RAZORPAY
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: Math.round(finalPayableTotal * 100),
          currency: "INR",
          receipt: `sub_${Date.now()}`
        }
      });

      if (orderError) throw new Error(`Order Creation Failed: ${orderError.message}`);

      const res = await loadRazorpay();
      if (!res) throw new Error("Razorpay SDK failed to load.");

      const options: RazorpayOptions = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MM Dairy Farm",
        description: `Subscription: ${configProduct.name}`,
        order_id: orderData.id,
        handler: async (response: RazorpayResponse) => {
          try {
            await finalizeSubscription(response.razorpay_payment_id);
          } catch (err: any) {
            console.error("Finalization Error:", err);
            toast({ title: "Activation Failed", description: err.message, variant: "destructive" });
          }
        },
        prefill: {
          name: profile?.full_name || "",
          email: user?.email || "",
          contact: profile?.phone || "",
        },
        theme: { color: "#059669" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Setup Flow Error:", err);
      toast({ title: "Setup Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        </div>
      </Layout>
    );
  }

  // --- RENDERING ---

  if (isAddingConfig && configProduct) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <CircularBackButton 
            onClick={() => navigate("/products?context=subscription")} 
            className="mb-8"
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-6">
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-[24px] p-2 flex items-center justify-center shadow-inner border border-emerald-100/50">
                    <img src={configProduct.image} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">{configProduct.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-emerald-600 text-white font-black px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest">
                        {formatWeight(selectedWeight, unitType)}
                      </Badge>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Size</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-2">How Often?</Label>
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold bg-slate-50 shadow-inner group hover:bg-white transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                        <SelectItem value="daily">Every Day</SelectItem>
                        <SelectItem value="alternate">Alternate Days</SelectItem>
                        <SelectItem value="weekly">Once a Week</SelectItem>
                        <SelectItem value="monthly">Once a Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-2">What Time?</Label>
                    <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold bg-slate-50 shadow-inner group hover:bg-white transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                        <SelectItem value="morning">Morning Only</SelectItem>
                        <SelectItem value="evening">Evening Only</SelectItem>
                        <SelectItem value="both">Both Slots (AM + PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-2">Starting On</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                      className="h-14 rounded-2xl border-slate-200 font-black bg-slate-50 shadow-inner focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-2">Ending On</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="h-14 rounded-2xl border-slate-200 font-black bg-slate-50 shadow-inner focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-8 space-y-4">
                  {!showAllAddresses ? (
                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-200 group hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer" onClick={() => setShowAllAddresses(true)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Home className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">
                            {addresses.find(a => a.id === selectedAddressId)?.address_line || "No address selected"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Primary Drop Location</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          onClick={() => { setSelectedAddressId(addr.id); setShowAllAddresses(false); }}
                          className={cn(
                            "p-5 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between",
                            selectedAddressId === addr.id ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10" : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              selectedAddressId === addr.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{addr.address_line}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{addr.area_name || "Custom Location"}</span>
                            </div>
                          </div>
                          {selectedAddressId === addr.id && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                        </div>
                      ))}
                      <Button variant="link" className="text-slate-400 text-[10px] font-bold uppercase w-full hover:no-underline hover:text-rose-500" onClick={() => setShowAllAddresses(false)}>Cancel Selection</Button>
                    </div>
                  )}
                </div>

                {/* 🏦 Prominent Wallet Option */}
                {availableCoins > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div
                      onClick={() => setUseCoins(!useCoins)}
                      className={cn(
                        "p-6 rounded-[32px] border-2 transition-all cursor-pointer group flex items-center justify-between",
                        useCoins ? "border-amber-400 bg-amber-50 shadow-xl shadow-amber-500/5" : "border-slate-100 bg-slate-50 opacity-70 grayscale hover:grayscale-0 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl p-1 flex items-center justify-center transition-transform group-hover:scale-110",
                          useCoins ? "bg-amber-100 scale-110" : "bg-white"
                        )}>
                          <img src="/favicon.png" className="w-full h-full object-cover rounded-xl" alt="Coin" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight uppercase italic tracking-tighter">Use Wallet Balance</p>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">₹{availableCoins} Available Coins</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all",
                        useCoins ? "bg-amber-500 border-white shadow-lg" : "bg-white border-slate-200"
                      )}>
                        {useCoins && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 ml-2 italic tracking-widest">
                      1 Coin = ₹1 Discount • Applicable on entire payable total
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 space-y-6">
              <div className="bg-slate-950 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <h3 className="text-xl font-black uppercase tracking-tighter mb-8 relative z-10 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Payment Summary
                </h3>

                <div className="space-y-5 relative z-10 mb-10">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <span>Drop Count</span>
                    <span className="text-white text-sm">{totalDeliveries} Deliveries</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <span>Unit Price ({formatWeight(selectedWeight, unitType)})</span>
                    <span className="text-white text-sm">₹{currentUnitPrice}</span>
                  </div>

                  {/* Summary Details */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <span>Coins Applied</span>
                      <span className={cn("text-sm", coinsToUse > 0 ? "text-amber-500" : "text-white/20")}>-₹{Math.round(coinsToUse)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-10 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-2">Total Amount Payable</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-emerald-400 tracking-tighter italic">₹{Math.round(finalPayableTotal)}</p>
                    {coinsToUse > 0 && (
                      <p className="text-sm font-black text-amber-500 line-through opacity-40 italic">₹{Math.round(rawTotalPrice)}</p>
                    )}
                  </div>
                  {coinsToUse > 0 && (
                    <p className="text-[9px] font-bold text-amber-400 uppercase mt-2 italic">
                      -₹{Math.round(coinsToUse)} Wallet Credit Applied
                    </p>
                  )}
                  <p className="text-[9px] font-bold text-white/30 uppercase mt-4 leading-tight italic">
                    * Strictly prepaid model. Subscription will end on the selected date.
                  </p>
                </div>

                <Button
                  disabled={isSubmitting || !selectedAddressId}
                  onClick={handleSubscribe}
                  className="w-full h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 group transition-all border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-3">
                      {Math.round(finalPayableTotal) === 0 ? "Pay with Coins & Activate" : "Start Subscription"}
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="bg-emerald-50/80 backdrop-blur-sm p-6 rounded-[32px] border border-emerald-100/50 shadow-sm group hover:scale-[1.02] transition-transform">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Zero-Contact Delivery</h4>
                    <p className="text-[11px] font-medium text-emerald-800 leading-tight italic opacity-70">
                      Your drops will happen automatically based on your selected frequency.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Dashboard List View ---
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {subscriptions.length === 0 ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all" />
              <div className="relative w-40 h-40 bg-white rounded-[48px] flex items-center justify-center shadow-2xl border-b-8 border-slate-100 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                <CalendarRange className="w-20 h-20 text-emerald-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-emerald-600 rounded-2xl shadow-xl border-4 border-white flex items-center justify-center text-white">
                <Plus className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">Manage Your Daily Freshness</h1>
              <p className="text-slate-500 font-bold text-xl leading-snug max-w-lg mx-auto opacity-80 uppercase tracking-tight">
                No active subscriptions found. Subscribe to our farm fresh milk and curd for a healthy life.
              </p>
            </div>

            <Button
              onClick={() => navigate("/products?context=subscription")}
              className="h-16 px-12 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-600/30 border-b-4 border-emerald-900 active:translate-y-1 active:border-b-0 transition-all font-display"
            >
              Start Building Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b-2 border-slate-100 border-dashed">
              <div className="flex items-center gap-6">
                <CircularBackButton onClick={() => navigate("/")} />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Pipeline</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black text-emerald-950 uppercase tracking-tighter leading-none">My Subscriptions</h1>
                </div>
              </div>
              <Button
                onClick={() => navigate("/products?context=subscription")}
                className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-950/20 border-b-4 border-slate-700 active:translate-y-1 active:border-b-0 transition-all"
              >
                <Plus className="w-5 h-5 mr-3" /> Add Product
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {subscriptions.map(sub => (
                <Card key={sub.id} className="rounded-[40px] overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group bg-white shadow-emerald-900/5 ring-1 ring-slate-100 relative">
                  <div className="relative h-28 bg-emerald-50 flex items-center px-8 border-b border-emerald-100/50">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-sm border border-emerald-100">
                        <img src={sub.products?.image_url || sub.products?.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-900 text-xl uppercase tracking-tighter leading-none mb-1.5">{sub.products?.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white px-2 py-0.5 rounded-md shadow-sm border border-emerald-100">
                            {sub.quantity} units · {formatWeight(sub.selected_weight || 1000, sub.unit_type || 'ml')}
                          </span>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border-none",
                            sub.status === 'active' ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                          )}>
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Delivery Cycle</p>
                        <p className="text-sm font-black text-slate-800 capitalize flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500" /> {sub.plan_type}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Upcoming Drop</p>
                        <p className="text-sm font-black text-slate-800 flex items-center justify-end gap-2">
                          {format(new Date(sub.next_delivery_date), "dd MMM")} <Truck className="w-4 h-4 text-emerald-500" />
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 py-4 border-y border-slate-50">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">Plan Validity</span>
                        <span className="text-slate-700">{format(new Date(sub.start_date), "dd MMM")} - {format(new Date(sub.end_date), "dd MMM, yy")}</span>
                      </div>
                      <div className="flex items-start gap-4">
                        <MapPin className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saved Destination</p>
                          <p className="text-[11px] font-bold text-slate-600 leading-tight">{sub.subscriptions?.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-4">
                      <Button
                        variant="ghost"
                        disabled={processingId === sub.id}
                        onClick={() => toggleStatus(sub.id, sub.status)}
                        className={cn(
                          "flex-1 font-black h-14 rounded-[22px] text-[10px] uppercase border-2 tracking-widest transition-all active:scale-95",
                          sub.status === 'active' ? "border-amber-100 text-amber-600 hover:bg-amber-50" : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                          (sub.status === 'active' ? 'Pause Plan' : 'Resume Plan')}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={processingId === sub.id}
                        onClick={() => cancelSubscription(sub.id)}
                        className="font-black h-14 w-14 p-0 rounded-[22px] bg-rose-50 text-rose-300 hover:bg-rose-100 hover:text-rose-600 border border-rose-100 transition-all active:scale-95"
                      >
                        {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Subscriptions;
