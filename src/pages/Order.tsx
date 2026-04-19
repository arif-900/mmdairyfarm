import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Loader2, ShieldCheck, MapPin, CreditCard, Wallet, ArrowRight, AlertCircle, Map, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AddressSelector from "@/components/order/AddressSelector";
import { formatWeight } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { calculateDistance, FARM_LOCATION, calculateShippingFee } from "@/utils/distance";
import { Truck, Info } from "lucide-react";
import { getMaxDeliveryDays, getExpectedDeliveryDate, resolveDeliveryDays } from "@/utils/delivery";

const Order = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, totalPrice: cartSubtotal, clearOrderedItems } = useCart();
  
  // Check if we have a direct buyNowItem from state
  const buyNowItem = location.state?.buyNowItem;
  
  // Filter for only selected items OR use the single buyNowItem
  const activeItems = buyNowItem ? [buyNowItem] : items.filter(item => item.selected);
  const activeSubtotal = buyNowItem ? (buyNowItem.calculatedPrice * buyNowItem.quantity) : cartSubtotal;
  
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isTemporaryAddress, setIsTemporaryAddress] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
    const [whatsappOptIn, setWhatsappOptIn] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    // Promo Code States
    const [promoInput, setPromoInput] = useState("");
    const [checkingPromo, setCheckingPromo] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoMessage, setPromoMessage] = useState<{type: "error" | "success", text: string} | null>(null);

    // Coins State
    const [useCoins, setUseCoins] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // Sync distance and fees when address changes
  useEffect(() => {
    if (selectedAddress) {
        // Calculate distance on the fly if missing from database record (fallback)
        let dist = selectedAddress.distance || selectedAddress.dist || null;
        
        if (dist === null && selectedAddress.lat && selectedAddress.lng) {
            dist = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, selectedAddress.lat, selectedAddress.lng);
        }
        
        setDistance(dist);
        
        if (dist !== null && dist > 50) {
            setDistanceError(`Outside delivery area: ${dist.toFixed(1)}km away. Limit is 50km.`);
            setShippingFee(-1);
        } else {
            setDistanceError(null);
            // Calculate fee dynamically if not provided or 0
            const fee = (selectedAddress.shipping_fee && selectedAddress.shipping_fee > 0) 
              ? selectedAddress.shipping_fee 
              : (dist !== null ? calculateShippingFee(dist) : 0);
            setShippingFee(fee);
        }
    } else {
        setDistance(null);
        setShippingFee(0);
        setDistanceError(null);
    }
  }, [selectedAddress]);

  const handlePaymentSuccess = async (response: any, orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
          orderId,
        },
      });

      if (error || !data?.success) throw new Error("Verification failed");

      clearOrderedItems();
      navigate(`/payment-success?order_id=${orderId}`);
    } catch (err) {
      toast({ title: "Payment Error", description: "Verification failed. Contact support.", variant: "destructive" });
      navigate(`/payment-cancelled?order_id=${orderId}`);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    setPromoMessage(null);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoInput.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      
      if (error && error.code !== '42P01') throw error;
      
      if (!data) {
        setPromoMessage({ type: "error", text: "Invalid or expired promo code" });
        setAppliedPromo(null);
      } else {
        setAppliedPromo(data);
        setPromoMessage({ type: "success", text: `Promo code ${data.code} applied!` });
      }
    } catch (err: any) {
      setPromoMessage({ type: "error", text: "Error verifying code" });
    } finally {
      setCheckingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMessage(null);
  };

  // Calculate Discounts
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      discountAmount = (activeSubtotal * appliedPromo.discount_value) / 100;
    } else {
      discountAmount = appliedPromo.discount_value;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth?redirect=/order"); return; }
    if (activeItems.length === 0) { toast({ title: "Empty Cart", variant: "destructive" }); return; }
    
    // Coins pre-calc
    const totalBeforeCoins = Math.max(0, activeSubtotal + (shippingFee > 0 ? shippingFee : 0) - discountAmount);
    const availableCoins = profile?.reward_coins || 0;
    const maxApplicableCoins = Math.min(availableCoins, totalBeforeCoins);
    const coinsApplied = (useCoins && paymentMethod === 'online') ? maxApplicableCoins : 0;
    // Ensure we have the latest fee before submission
    let finalFee = shippingFee;
    if (selectedAddress && (finalFee === 0 || finalFee === -1)) {
        let dist = selectedAddress.distance || selectedAddress.dist || null;
        if (dist === null && selectedAddress.lat && selectedAddress.lng) {
            dist = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, selectedAddress.lat, selectedAddress.lng);
        }
        if (dist !== null) {
            finalFee = calculateShippingFee(dist);
        }
    }

    if (!selectedAddress || finalFee === -1 || distanceError) {
      toast({ 
        title: "Address Required", 
        description: distanceError || "Please select a delivery address from your address book before proceeding.", 
        variant: "destructive" 
      });
      return;
    }

    if (!paymentMethod) {
      toast({ 
        title: "Payment Method Missing", 
        description: "Please select a payment method (Online or COD).", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Shipping Fee Before Insert:", finalFee);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: activeItems.map(i => ({
            id: i.productId,
            name: i.name,
            price: i.calculatedPrice,
            quantity: i.quantity,
            weight: i.selectedWeight,
            unit_type: i.unitType,
            delivery_days: resolveDeliveryDays((i as any).deliveryDays)
          })),
          user_name: selectedAddress.full_name,
          shipping_address: (selectedAddress.address_line || selectedAddress.address || "").replace(/^MDR\d+\b\s*,?\s*/i, ""),
          shipping_lat: selectedAddress.lat,
          shipping_lng: selectedAddress.lng,
          phone: selectedAddress.phone,
          delivery_type: "one-time",
          payment_method: paymentMethod,
          whatsapp_opt_in: whatsappOptIn,
          shipping_fee: finalFee,
          discount_amount: discountAmount,
          promo_code: appliedPromo ? appliedPromo.code : null,
          coins_used: coinsApplied,
        },
      });

      if (error) throw error;

      if (paymentMethod === "cod" || totalAmount === 0) {
        if (!buyNowItem) clearOrderedItems();
        navigate(`/payment-success?order_id=${data.orderId}&cod=${paymentMethod === "cod"}`);
      } else {
        const options = {
          key: data.razorpayKeyId,
          amount: data.amount,
          currency: data.currency,
          name: "MMVALI Dairy Farm",
          description: "Farm Fresh Order",
          order_id: data.razorpayOrderId,
          handler: (res: any) => handlePaymentSuccess(res, data.orderId),
          prefill: { 
            name: selectedAddress.full_name, 
            email: user?.email || "", 
            contact: selectedAddress.phone 
          },
          theme: { color: "#16a34a" },
          modal: {
            onDismiss: () => {
              setIsProcessing(false);
              toast({ title: "Payment Cancelled", description: "You cancelled the payment process.", variant: "destructive" });
            }
          },
          retry: { enabled: true, enabled_netbanking_retry: true },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast({ title: "Order Failed", description: err.message, variant: "destructive" });
    }
  };

  const totalBeforeCoins = Math.max(0, activeSubtotal + (shippingFee > 0 ? shippingFee : 0) - discountAmount);
  const availableCoins = profile?.reward_coins || 0;
  const maxApplicableCoins = Math.min(availableCoins, totalBeforeCoins);
  const coinsApplied = (useCoins && paymentMethod === 'online') ? maxApplicableCoins : 0;
  const totalAmount = Math.max(0, totalBeforeCoins - coinsApplied);
  
  // Predict coins to earn (5% of final amount)
  const predictedCoinsEarned = Math.floor(totalAmount * 0.05);
  
  const maxDeliveryDays = getMaxDeliveryDays(activeItems);
  const expectedDate = getExpectedDeliveryDate(maxDeliveryDays);

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        {/* Header */}
        <section className="bg-primary pt-12 pb-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white/10,transparent)]" />
          <div className="container-main text-center relative z-10">
            <h1 className="font-display text-4xl font-black text-white italic tracking-tighter mb-2">Secure Checkout</h1>
            <p className="text-white/70 font-medium text-xs uppercase tracking-[0.3em]">Farm Fresh to Your Doorstep</p>
          </div>
        </section>

        <div className="container-main -mt-16 max-w-5xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
              {/* Delivery Details */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <MapPin className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-800 italic">Delivery Details</h2>
                </div>

                <div className="space-y-6">
                  {user ? (
                    <div className="space-y-4">
                      <AddressSelector 
                        userId={user.id}
                        selectedId={selectedAddress?.id}
                        onSelect={setSelectedAddress}
                        onTemporaryAddress={setIsTemporaryAddress}
                      />
                      {!selectedAddress && !authLoading && (
                        <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl animate-pulse">
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <p className="text-sm font-black text-orange-700 uppercase italic">Please add or select a delivery address</p>
                        </div>
                      )}
                    </div>
                  ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                         <p className="font-black text-sm text-slate-400 uppercase tracking-widest mb-4">You must be logged in to checkout</p>
                         <Button onClick={() => navigate("/auth?redirect=/order")} className="rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest">Sign In Now</Button>
                      </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <CreditCard className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-800 italic">Payment Method</h2>
                </div>

                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(val: any) => setPaymentMethod(val)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label 
                    htmlFor="online" 
                    className={cn(
                        "flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all",
                        paymentMethod === 'online' ? "border-primary bg-emerald-50/50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                    )}
                  >
                    <RadioGroupItem value="online" id="online" className="sr-only" />
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", paymentMethod === 'online' ? "border-primary" : "border-slate-300")}>
                        {paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-primary rounded-full transition-all" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm text-slate-800 italic uppercase">Secure Online</p>
                      <p className="text-[10px] font-bold text-slate-400">UPI, Cards, Netbanking</p>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-emerald-500 opacity-40" />
                  </Label>

                  <Label 
                    htmlFor="cod" 
                    className={cn(
                        "flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all",
                        paymentMethod === 'cod' ? "border-primary bg-emerald-50/50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                    )}
                  >
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", paymentMethod === 'cod' ? "border-primary" : "border-slate-300")}>
                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-primary rounded-full transition-all" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm text-slate-800 italic uppercase">Cash on Delivery</p>
                      <p className="text-[10px] font-bold text-slate-400">Pay when order arrives</p>
                    </div>
                    <Wallet className="w-6 h-6 text-slate-400 opacity-40" />
                  </Label>
                </RadioGroup>
              </div>

              {/* WhatsApp Notification Opt-in */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-emerald-50/30 transition-all" onClick={() => setWhatsappOptIn(!whatsappOptIn)}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    whatsappOptIn ? "bg-emerald-100" : "bg-slate-100"
                  )}>
                    <ShoppingBag className={cn("w-5 h-5", whatsappOptIn ? "text-primary" : "text-slate-400")} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-black text-slate-800 italic">WhatsApp Updates</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Get order status & delivery alerts</p>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  whatsappOptIn ? "bg-primary" : "bg-slate-200"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                    whatsappOptIn ? "left-7" : "left-1"
                  )} />
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1C2533] rounded-[40px] p-8 text-white shadow-2xl sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-black italic tracking-tighter">Order Summary</h2>
                </div>

                {/* Items List */}
                <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {activeItems.length === 0 ? (
                        <p className="text-center py-10 text-white/30 font-black uppercase text-xs tracking-[0.2em]">Your Box is Empty</p>
                    ) : (
                        activeItems.map((item, idx) => (
                            <div key={`${item.productId}-${idx}`} className="flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm italic line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            {formatWeight(item.selectedWeight, (item.unitType as any) || 'g')} × {item.quantity}
                                            {(() => {
                                                const days = resolveDeliveryDays(item.deliveryDays);
                                                if (days === 0) {
                                                    return (
                                                        <span className="flex items-center gap-1 text-amber-500 lowercase tracking-tight">
                                                            <Truck className="w-2.5 h-2.5" />
                                                            same day
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="flex items-center gap-1 text-primary lowercase tracking-tight">
                                                        <Truck className="w-2.5 h-2.5" />
                                                        {days} {days === 1 ? 'day' : 'days'}
                                                    </span>
                                                );
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-black text-sm italic">₹{item.calculatedPrice * item.quantity}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-4 pt-8 border-t border-white/10">
                    
                    {/* Promo Code Input */}
                    {!appliedPromo ? (
                        <div className="mb-4">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter Promo Code" 
                                    value={promoInput}
                                    onChange={e => setPromoInput(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 uppercase"
                                />
                                <Button 
                                    variant="secondary" 
                                    disabled={checkingPromo || !promoInput.trim()}
                                    onClick={handleApplyPromo}
                                    className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold"
                                >
                                    {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                </Button>
                            </div>
                            {promoMessage && (
                                <p className={cn("text-xs mt-2 font-medium uppercase tracking-wider", promoMessage.type === 'error' ? 'text-rose-400' : 'text-emerald-400')}>
                                    {promoMessage.text}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mb-4 flex items-center justify-between bg-primary-foreground/10 border border-primary-foreground/20 p-3 rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> {appliedPromo.code} APPLIED
                                </p>
                                <p className="text-[10px] text-white/60">{appliedPromo.description}</p>
                            </div>
                            <button onClick={removePromo} className="text-[10px] font-bold text-rose-400 uppercase hover:underline">Remove</button>
                        </div>
                    )}

                    <div className="flex justify-between items-center opacity-60">
                        <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-black text-sm">₹{activeSubtotal}</span>
                    </div>
                    
                    {appliedPromo && (
                        <div className="flex justify-between items-center text-emerald-400">
                            <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                            <span className="font-black text-sm">- ₹{discountAmount.toFixed(0)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Shipping</span>
                        <span className={cn(
                            "font-black text-sm italic",
                            shippingFee === 0 ? "text-primary" : "text-white"
                        )}>
                            {shippingFee === 0 ? "FREE" : shippingFee === -1 ? "N/A" : `₹${shippingFee}`}
                        </span>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-2">
                        <label className={cn("flex items-center justify-between group", paymentMethod === 'cod' ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
                            <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 p-0.5 shadow-lg shadow-amber-200/50 relative overflow-hidden">
                                        <img 
                                            src="/favicon.png" 
                                            className="w-full h-full object-cover rounded-full" 
                                            alt="Coin"
                                        />
                                    </div>
                                <div>
                                    <p className="text-sm font-black text-white italic">Use Reward Coins</p>
                                    <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
                                        {paymentMethod === 'cod' ? 'Online only' : `Balance: ${availableCoins}`}
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-12 h-6 rounded-full relative transition-all duration-300",
                                useCoins && paymentMethod === 'online' && availableCoins > 0 ? "bg-amber-500" : "bg-white/10"
                            )}>
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    disabled={paymentMethod === 'cod' || availableCoins === 0}
                                    checked={useCoins && paymentMethod === 'online' && availableCoins > 0}
                                    onChange={(e) => setUseCoins(e.target.checked)}
                                />
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                    useCoins && paymentMethod === 'online' && availableCoins > 0 ? "left-7" : "left-1"
                                )} />
                            </div>
                        </label>
                    </div>
                    
                    {coinsApplied > 0 && (
                        <div className="flex justify-between items-center text-amber-500">
                            <span className="text-xs font-bold uppercase tracking-widest">Coins Used</span>
                            <span className="font-black text-sm">- ₹{coinsApplied.toFixed(0)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                        <span className="text-sm font-black italic uppercase tracking-widest text-primary">Total Amount</span>
                        <span className="text-4xl font-black italic tracking-tighter">₹{totalAmount.toFixed(0)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-500 p-0.5 relative overflow-hidden">
                                <img src="/favicon.png" className="w-full h-full object-cover rounded-full" alt="Coin" />
                            </div>
                            <span className="text-xs font-bold text-amber-500/90 uppercase tracking-wider">Coins to Earn</span>
                        </div>
                        <span className="text-sm font-black text-amber-500">+{predictedCoinsEarned}</span>
                    </div>

                    <div className="mt-6 p-4 bg-white/5 rounded-3xl border border-white/10 space-y-2">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Consolidated Delivery</span>
                        </div>
                        <p className="text-xs font-black italic">
                            All items delivered together in {maxDeliveryDays} {maxDeliveryDays === 1 ? 'day' : 'days'}
                        </p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            Expected: {format(expectedDate, "EEEE, dd MMM")}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    {/* Dynamic Warnings */}
                    {activeItems.length === 0 && (
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase">Wait! Your cart is currently empty. Head back to products to add some freshness.</p>
                        </div>
                    )}
                    
                    {distanceError && (
                        <div className="flex items-start gap-3 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase">{distanceError}</p>
                        </div>
                    )}

                    {!selectedAddress && user && (
                        <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/30">
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-orange-500 leading-relaxed uppercase">Attention: Please add a delivery address to proceed with your order.</p>
                        </div>
                    )}

                    <Button 
                        form={user ? "checkout-form" : undefined}
                        type={user ? "submit" : "button"}
                        onClick={() => !user && navigate("/auth?redirect=/order")}
                        disabled={(user && (isProcessing || !razorpayLoaded || activeItems.length === 0 || !selectedAddress || distance === null || !!distanceError || shippingFee === -1))}
                        className={cn(
                            "w-full h-16 rounded-[28px] text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl group relative overflow-hidden transition-all active:scale-95 border-b-4",
                            user 
                              ? "bg-primary hover:bg-primary/90 shadow-primary/40 border-indigo-700" 
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 border-indigo-800"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            <div className="flex items-center justify-between px-6 w-full">
                                <span>{user ? "Place Your Order" : "Login to Place Order"}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    </Button>
                </div>
            </div>

            {/* Support Info */}
            <div className="flex items-center justify-center gap-6 opacity-40 pt-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase tracking-widest">SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Global GPS Verified</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Order;
