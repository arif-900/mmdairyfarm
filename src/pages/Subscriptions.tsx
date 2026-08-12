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
      fetchData(true);

      const channel = supabase
        .channel(`user-subscriptions-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscription_items",
          },
          () => {
            fetchData(false);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "addresses",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchData(false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
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
      if (showLoader) setLoading(false);
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
        <div className="bg-[#061A13] min-h-[85vh] py-6 sm:py-10 px-3.5">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <CircularBackButton 
              onClick={() => navigate("/products?context=subscription")} 
              className="mb-4 sm:mb-8 border-white/10 bg-[#0B2118] text-[#F5F3EC]"
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8">
              <div className="md:col-span-8 space-y-4 sm:space-y-6">
                <div className="bg-[#0B2118] rounded-2xl md:rounded-[32px] p-4 sm:p-8 shadow-2xl border border-white/10 text-[#F5F3EC]">
                  <div className="flex items-center gap-4 mb-4 sm:mb-8">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#F1EEE7] rounded-xl sm:rounded-2xl p-1.5 flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                      <img src={configProduct.image} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-3xl font-black text-[#F5F3EC] uppercase tracking-tight leading-none">{configProduct.name}</h2>
                      <div className="flex items-center gap-2 mt-1 sm:mt-2">
                        <Badge className="bg-[#C98A24] text-[#061A13] font-bold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                          {formatWeight(selectedWeight, unitType)}
                        </Badge>
                        <span className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-wider">Selected Size</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold uppercase text-[10px] tracking-wider text-[#AAB8B0] ml-1">How Often?</Label>
                      <Select value={planType} onValueChange={setPlanType}>
                        <SelectTrigger className="h-11 sm:h-13 rounded-xl border-white/10 font-bold bg-[#10291F] text-[#F5F3EC] transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-[#061A13] border-white/10 text-[#F5F3EC]">
                          <SelectItem value="daily">Every Day</SelectItem>
                          <SelectItem value="alternate">Alternate Days</SelectItem>
                          <SelectItem value="weekly">Once a Week</SelectItem>
                          <SelectItem value="monthly">Once a Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold uppercase text-[10px] tracking-wider text-[#AAB8B0] ml-1">What Time?</Label>
                      <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                        <SelectTrigger className="h-11 sm:h-13 rounded-xl border-white/10 font-bold bg-[#10291F] text-[#F5F3EC] transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-[#061A13] border-white/10 text-[#F5F3EC]">
                          <SelectItem value="morning">Morning Only</SelectItem>
                          <SelectItem value="evening">Evening Only</SelectItem>
                          <SelectItem value="both">Both Slots (AM + PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold uppercase text-[10px] tracking-wider text-[#AAB8B0] ml-1">Starting On</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                        className="h-11 sm:h-13 rounded-xl border-white/10 font-bold bg-[#10291F] text-[#F5F3EC] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold uppercase text-[10px] tracking-wider text-[#AAB8B0] ml-1">Ending On</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="h-11 sm:h-13 rounded-xl border-white/10 font-bold bg-[#10291F] text-[#F5F3EC] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-6 space-y-3">
                    {!showAllAddresses ? (
                      <div className="flex items-center justify-between p-3.5 bg-[#10291F] rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" onClick={() => setShowAllAddresses(true)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#061A13] rounded-lg flex items-center justify-center border border-white/10 shrink-0 text-[#C98A24]">
                            <Home className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-[#F5F3EC] leading-tight truncate max-w-[160px] sm:max-w-xs">
                              {addresses.find(a => a.id === selectedAddressId)?.address_line || "No address selected"}
                            </p>
                            <p className="text-[10px] font-bold text-[#C98A24] uppercase tracking-wider mt-0.5">Primary Drop Location</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[#C98A24] hover:bg-[#061A13]">
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold uppercase text-[10px] tracking-wider text-[#AAB8B0]">Select Delivery Address</Label>
                          <Button variant="ghost" size="sm" onClick={() => setShowAllAddresses(false)} className="text-[10px] font-bold text-[#AAB8B0]">
                            Done
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {addresses.map(addr => (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all",
                                selectedAddressId === addr.id
                                  ? "border-[#C98A24] bg-[#10291F]"
                                  : "border-white/10 bg-[#061A13] hover:border-white/20"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <MapPin className={cn("w-4 h-4 shrink-0", selectedAddressId === addr.id ? "text-[#C98A24]" : "text-[#AAB8B0]")} />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#F5F3EC] truncate">{addr.full_name} ({addr.label})</p>
                                  <p className="text-[10px] text-[#AAB8B0] truncate">{addr.address_line}</p>
                                </div>
                              </div>
                              {selectedAddressId === addr.id && (
                                <CheckCircle2 className="w-4 h-4 text-[#C98A24] shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coins Toggle */}
                    {availableCoins > 0 && (
                      <div className="p-3.5 bg-[#10291F] rounded-xl border border-white/10">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setUseCoins(!useCoins)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg p-1 bg-[#061A13] border border-white/10 flex items-center justify-center shrink-0">
                              <img src="/favicon.png" className="w-full h-full object-cover rounded-md" alt="Coin" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#F5F3EC] uppercase tracking-tight">Use Wallet Balance</p>
                              <p className="text-[10px] font-bold text-[#C98A24] uppercase tracking-wider mt-0.5">₹{availableCoins} Coins Available</p>
                            </div>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                            useCoins ? "bg-[#C98A24] border-[#C98A24] text-[#061A13]" : "border-white/20 bg-[#061A13]"
                          )}>
                            {useCoins && <CheckCircle2 className="w-3.5 h-3.5 text-[#061A13]" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 space-y-4 sm:space-y-6">
                <div className="bg-[#0B2118] rounded-2xl md:rounded-[32px] p-4 sm:p-6 text-[#F5F3EC] shadow-2xl border border-white/10 relative overflow-hidden">
                  <h3 className="text-lg font-black uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2 text-[#F5F3EC]">
                    <CreditCard className="w-5 h-5 text-[#C98A24]" /> PAYMENT <span className="text-[#C98A24]">SUMMARY</span>
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-[#AAB8B0] text-[10px] font-bold uppercase tracking-wider">
                      <span>Drop Count</span>
                      <span className="text-[#F5F3EC] text-xs font-bold">{totalDeliveries} Deliveries</span>
                    </div>
                    <div className="flex justify-between items-center text-[#AAB8B0] text-[10px] font-bold uppercase tracking-wider">
                      <span>Unit Price ({formatWeight(selectedWeight, unitType)})</span>
                      <span className="text-[#F5F3EC] text-xs font-bold">₹{currentUnitPrice}</span>
                    </div>

                    {/* Summary Details */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-[#AAB8B0] text-[10px] font-bold uppercase tracking-wider">
                        <span>Coins Applied</span>
                        <span className={cn("text-xs font-bold", coinsToUse > 0 ? "text-[#C98A24]" : "text-[#AAB8B0]")}>-₹{Math.round(coinsToUse)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#061A13] rounded-2xl border border-white/10 mb-6">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Total Amount Payable</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl sm:text-4xl font-black text-[#C98A24] tracking-tight">₹{Math.round(finalPayableTotal)}</p>
                      {coinsToUse > 0 && (
                        <p className="text-xs font-bold text-[#AAB8B0] line-through opacity-50">₹{Math.round(rawTotalPrice)}</p>
                      )}
                    </div>
                    <p className="text-[8px] font-bold text-[#AAB8B0] uppercase mt-2 leading-tight">
                      * Strictly prepaid model. Subscription ends on selected date.
                    </p>
                  </div>

                  <Button
                    disabled={isSubmitting || !selectedAddressId}
                    onClick={handleSubscribe}
                    className="w-full h-13 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase tracking-wider shadow-xl transition-all border-b-4 border-[#A36D18] active:translate-y-0.5 text-xs"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        {Math.round(finalPayableTotal) === 0 ? "Pay with Coins & Activate" : "Start Subscription"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>

                <div className="bg-[#0B2118] p-5 rounded-2xl border border-white/10 text-[#F5F3EC]">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-[#10291F] border border-white/10 rounded-xl flex items-center justify-center shrink-0 text-[#C98A24]">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#F5F3EC] uppercase tracking-tight">Zero-Contact Delivery</h4>
                      <p className="text-[11px] font-medium text-[#AAB8B0] leading-tight">
                        Your drops will happen automatically based on your selected frequency.
                      </p>
                    </div>
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
      <div className="bg-[#061A13] min-h-[80vh] py-12 px-4">
        <div className="max-w-6xl mx-auto">
        {subscriptions.length === 0 ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#C98A24]/20 blur-3xl rounded-full group-hover:bg-[#C98A24]/30 transition-all" />
              <div className="relative w-40 h-40 bg-[#0B2118] rounded-[48px] flex items-center justify-center shadow-2xl border border-white/10 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                <CalendarRange className="w-20 h-20 text-[#C98A24]" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-[#0F8A5F] rounded-2xl shadow-xl border-4 border-[#061A13] flex items-center justify-center text-white">
                <Plus className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-[#F5F3EC] uppercase tracking-tighter leading-none italic">Manage Your Daily Freshness</h1>
              <p className="text-[#AAB8B0] font-bold text-lg md:text-xl leading-snug max-w-lg mx-auto uppercase tracking-tight">
                No active subscriptions found. Subscribe to our farm fresh milk and curd for a healthy life.
              </p>
            </div>

            <Button
              onClick={() => navigate("/products?context=subscription")}
              className="h-16 px-12 rounded-[24px] bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#C98A24]/30 active:translate-y-1 transition-all font-display"
            >
              Start Building Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/10">
              <div className="flex items-center gap-6">
                <CircularBackButton onClick={() => navigate("/")} className="border-white/10 bg-[#0B2118] text-[#F5F3EC]" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-[#0F8A5F] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F8A5F]">Active Pipeline</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-[#F5F3EC] uppercase tracking-tighter leading-none">
                    MY <span className="text-[#C98A24]">SUBSCRIPTIONS</span>
                  </h1>
                </div>
              </div>
              <Button
                onClick={() => navigate("/products?context=subscription")}
                className="h-14 px-10 rounded-2xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-xs uppercase tracking-widest shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-3" /> Add Product
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {subscriptions.map(sub => (
                <Card key={sub.id} className="rounded-2xl md:rounded-[32px] overflow-hidden border border-white/10 shadow-2xl transition-all group bg-[#0B2118] text-[#F5F3EC] relative">
                  <div className="relative h-20 bg-[#10291F] flex items-center px-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#F1EEE7] rounded-xl p-1 shadow-sm border border-white/10 shrink-0 flex items-center justify-center">
                        <img src={sub.products?.image_url || sub.products?.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#F5F3EC] text-base uppercase tracking-tight leading-none mb-1 truncate max-w-[140px] sm:max-w-xs">{sub.products?.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#AAB8B0] bg-[#061A13] px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
                            {sub.quantity} units · {formatWeight(sub.selected_weight || 1000, sub.unit_type || 'ml')}
                          </span>
                          <Badge className={cn(
                            "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border-none shrink-0",
                            sub.status === 'active' ? "bg-[#0F8A5F] text-white" : "bg-[#C98A24] text-[#061A13]"
                          )}>
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase text-[#AAB8B0] tracking-widest">Delivery Cycle</p>
                        <p className="text-sm font-bold text-[#F5F3EC] capitalize flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C98A24]" /> {sub.plan_type}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold uppercase text-[#AAB8B0] tracking-widest">Upcoming Drop</p>
                        <p className="text-sm font-bold text-[#F5F3EC] flex items-center justify-end gap-2">
                          {format(new Date(sub.next_delivery_date), "dd MMM")} <Truck className="w-4 h-4 text-[#C98A24]" />
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 py-4 border-y border-white/10">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#718078] uppercase tracking-widest">Plan Validity</span>
                        <span className="text-[#AAB8B0]">{format(new Date(sub.start_date), "dd MMM")} - {format(new Date(sub.end_date), "dd MMM, yy")}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#C98A24] mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-[#718078] uppercase tracking-widest">Saved Destination</p>
                          <p className="text-[11px] font-medium text-[#F5F3EC] leading-tight">{sub.subscriptions?.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2.5">
                      <Button
                        variant="ghost"
                        disabled={processingId === sub.id}
                        onClick={() => toggleStatus(sub.id, sub.status)}
                        className="flex-1 font-bold h-11 rounded-xl text-[10px] uppercase border border-white/10 bg-[#10291F] text-[#C98A24] hover:bg-[#164431] transition-all"
                      >
                        {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                          (sub.status === 'active' ? 'Pause Plan' : 'Resume Plan')}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={processingId === sub.id}
                        onClick={() => cancelSubscription(sub.id)}
                        className="font-bold h-11 w-11 p-0 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-white/10 transition-all shrink-0"
                      >
                        {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Subscriptions;
