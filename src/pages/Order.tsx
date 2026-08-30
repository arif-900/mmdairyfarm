import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Loader2, ShieldCheck, MapPin, CreditCard, Wallet, ArrowRight, AlertCircle, Map, CheckCircle2 } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AddressSelector from "@/components/order/AddressSelector";
import { formatWeight } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { calculateDistance, FARM_LOCATION, calculateShippingFee } from "@/utils/distance";
import { calculateMaxCoinDiscount, coinsToRupees } from "@/utils/coins";
import { Truck, Info } from "lucide-react";
import { getMaxDeliveryDays, getExpectedDeliveryDate, resolveDeliveryDays } from "@/utils/delivery";

// Modular Checkout Components
import Stepper, { Step } from "@/components/ui/Stepper";
import { SummaryStep } from "@/components/checkout/SummaryStep";
import { DeliveryStep } from "@/components/checkout/DeliveryStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";

const Order = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, totalPrice: cartSubtotal, clearOrderedItems, addItem, removeItem, updateQuantity } = useCart();

  // Check if we have a direct buyNowItem from state
  const buyNowItem = location.state?.buyNowItem;

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);

  // Sync checkoutItems with the Cart items or location state buyNowItem
  useEffect(() => {
    if (buyNowItem) {
      setCheckoutItems(prev => prev.length > 0 ? prev : [buyNowItem]);
    } else {
      setCheckoutItems(items.filter(item => item.selected));
    }
  }, [buyNowItem, items]);

  const activeItems = checkoutItems;
  const activeSubtotal = checkoutItems.reduce((acc, item) => acc + (item.calculatedPrice * item.quantity), 0);

  const handleAddSuggested = (newItem: any) => {
    addItem(newItem);
    setCheckoutItems(prev => {
      const exists = prev.find(item => item.productId === newItem.productId && item.selectedWeight === newItem.selectedWeight);
      if (exists) {
        return prev.map(item => 
          (item.productId === newItem.productId && item.selectedWeight === newItem.selectedWeight)
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, { ...newItem, id: `temp-${Date.now()}`, selected: true }];
    });
  };

  const handleUpdateCheckoutQty = (productId: string, selectedWeight: number, delta: number) => {
    if (!buyNowItem) {
      const cartItem = items.find(item => item.productId === productId && item.selectedWeight === selectedWeight);
      if (cartItem) {
        updateQuantity(cartItem.id, delta);
      }
    }
    setCheckoutItems(prev => 
      prev.map(item => {
        if (item.productId === productId && item.selectedWeight === selectedWeight) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveCheckoutItem = (productId: string, selectedWeight: number) => {
    if (!buyNowItem) {
      const cartItem = items.find(item => item.productId === productId && item.selectedWeight === selectedWeight);
      if (cartItem) {
        removeItem(cartItem.id);
      }
    }
    setCheckoutItems(prev => prev.filter(item => !(item.productId === productId && item.selectedWeight === selectedWeight)));
  };

  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isTemporaryAddress, setIsTemporaryAddress] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [paymentMethod] = useState<"online">("online");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Steps State
  const [step, setStep] = useState(1);

  // Promo Code States
  const [promoInput, setPromoInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoMessage, setPromoMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

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
          : (dist !== null ? calculateShippingFee(dist, activeSubtotal) : 0);
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
    const calculatedFee = activeSubtotal > 1000 ? 0 : shippingFee;
    let finalFee = calculatedFee;
    if (activeSubtotal <= 1000 && selectedAddress && (finalFee === 0 || finalFee === -1)) {
      let dist = selectedAddress.distance || selectedAddress.dist || null;
      if (dist === null && selectedAddress.lat && selectedAddress.lng) {
        dist = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, selectedAddress.lat, selectedAddress.lng);
      }
      if (dist !== null) {
        finalFee = calculateShippingFee(dist, activeSubtotal);
      }
    }
    if (activeSubtotal > 1000) {
      finalFee = 0;
    }

    const totalBeforeCoins = Math.max(0, activeSubtotal + (finalFee > 0 ? finalFee : 0) - discountAmount);
    const availableCoins = profile?.reward_coins || 0;
    const { coinsToUse } = calculateMaxCoinDiscount(availableCoins, totalBeforeCoins);
    const coinsApplied = useCoins ? coinsToUse : 0;

    if (!selectedAddress || finalFee === -1 || distanceError) {
      toast({
        title: "Address Required",
        description: distanceError || "Please select a delivery address from your address book before proceeding.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: activeItems.map(i => ({
            id: i.productId,
            name: i.name,
            price: i.calculatedPrice,
            quantity: i.quantity,
            selected_weight: i.selectedWeight,
            unit_type: i.unitType,
            variant_label: `${i.selectedWeight}${i.unitType}`,
            delivery_days: resolveDeliveryDays((i as any).deliveryDays)
          })),
          user_name: selectedAddress.full_name,
          shipping_address: (selectedAddress.address_line || selectedAddress.address || "").replace(/^MDR\d+\b\s*,?\s*/i, ""),
          shipping_lat: selectedAddress.lat || 0,
          shipping_lng: selectedAddress.lng || 0,
          phone: selectedAddress.phone,
          delivery_type: "one-time",
          payment_method: "online",
          whatsapp_opt_in: whatsappOptIn,
          shipping_fee: finalFee,
          discount_amount: discountAmount,
          promo_code: appliedPromo ? appliedPromo.code : null,
          coins_used: coinsApplied,
        },
      });

      if (error) throw error;

      if (totalAmount === 0) {
        if (!buyNowItem) clearOrderedItems();
        navigate(`/payment-success?order_id=${data.orderId}`);
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

  const calculatedShippingFee = calculateShippingFee(distance ?? 0, activeSubtotal);
  const totalBeforeCoins = Math.max(0, activeSubtotal + (calculatedShippingFee > 0 ? calculatedShippingFee : 0) - discountAmount);
  const availableCoins = profile?.reward_coins || 0;
  const { coinsToUse, discountRupees } = calculateMaxCoinDiscount(availableCoins, totalBeforeCoins);
  const coinsApplied = useCoins ? coinsToUse : 0;
  const coinDiscountAmount = useCoins ? discountRupees : 0;
  const totalAmount = Math.max(0, totalBeforeCoins - coinDiscountAmount);

  // Predict coins to earn (4 Coins per ₹100 spent)
  const predictedCoinsEarned = totalAmount > 0 ? Math.floor((totalAmount / 100) * 4) : 0;

  const maxDeliveryDays = getMaxDeliveryDays(activeItems);
  const expectedDate = getExpectedDeliveryDate(maxDeliveryDays);

  const nextStep = () => {
    if (step === 1) {
      if (activeItems.length === 0) {
        toast({ title: "Cart is empty", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedAddress || !!distanceError) {
        toast({ title: "Valid address required", variant: "destructive" });
        return;
      }
      setStep(3);
    }
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <Layout>
      <div className="bg-[#061A13] min-h-screen pb-20 text-[#F5F3EC]">
        {/* Premium Checkout Header */}
        <section className="bg-[#082D20] border-b border-white/10 pt-16 pb-8 px-6">
          <div className="container-main max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
              <div className="flex items-center gap-6">
                <CircularBackButton onClick={step > 1 ? prevStep : () => navigate("/products")} className="border-white/10 bg-[#0B2118] text-[#F5F3EC]" />
                <div>
                  <h1 className="font-display text-4xl font-black text-[#F5F3EC] tracking-tight uppercase">
                    CHECKOUT <span className="text-[#C98A24]">ORDER</span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-main max-w-4xl px-4 mt-8 pb-20">
          <Stepper
            initialStep={step}
            onStepChange={setStep}
            footerClassName="hidden"
            stepCircleContainerClassName="!bg-transparent !border-none !shadow-none !p-0"
            stepContainerClassName="mb-12"
          >
            <Step>
              <SummaryStep
                items={activeItems}
                subtotal={activeSubtotal}
                promoInput={promoInput}
                setPromoInput={setPromoInput}
                checkingPromo={checkingPromo}
                appliedPromo={appliedPromo}
                promoMessage={promoMessage}
                handleApplyPromo={handleApplyPromo}
                removePromo={removePromo}
                discountAmount={discountAmount}
                onNext={nextStep}
                onAddSuggested={handleAddSuggested}
                onUpdateQty={handleUpdateCheckoutQty}
                onRemoveItem={handleRemoveCheckoutItem}
              />
            </Step>

            <Step>
              <DeliveryStep
                user={user}
                selectedAddress={selectedAddress}
                setSelectedAddress={setSelectedAddress}
                setIsTemporaryAddress={setIsTemporaryAddress}
                authLoading={authLoading}
                distance={distance}
                distanceError={distanceError}
                shippingFee={shippingFee}
                onNext={nextStep}
                onBack={prevStep}
                navigate={navigate}
              />
            </Step>

            <Step>
              <PaymentStep
                paymentMethod={paymentMethod}
                whatsappOptIn={whatsappOptIn}
                setWhatsappOptIn={setWhatsappOptIn}
                useCoins={useCoins}
                setUseCoins={setUseCoins}
                availableCoins={availableCoins}
                coinsApplied={coinsApplied}
                totalAmount={totalAmount}
                isProcessing={isProcessing}
                razorpayLoaded={razorpayLoaded}
                handleSubmit={handleSubmit}
                onBack={prevStep}
                selectedAddress={selectedAddress}
                shippingFee={calculatedShippingFee}
                predictedCoinsEarned={predictedCoinsEarned}
                expectedDate={expectedDate}
              />
            </Step>
          </Stepper>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-30 grayscale transition-all hover:opacity-50 hover:grayscale-0">
             <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bank Level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Farm Fresh Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">GPS Tracking Verified</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Order;
