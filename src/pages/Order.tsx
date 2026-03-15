import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CreditCard, Wallet, Truck, Plus, Minus, Loader2, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreProducts } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AddressInput from "@/components/order/AddressInput";
import PhoneInput from "@/components/order/PhoneInput";
import { createOrderDirectly } from "@/utils/orderUtils";

import { RazorpayOptions, RazorpayResponse, RazorpayInstance } from "@/types/razorpay";

// Detect if user is on mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

const Order = () => {
  const { products, loading: productsLoading } = useStoreProducts();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedProduct = searchParams.get("product");
  const { user, profile, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    product: preselectedProduct || "",
    quantity: "1",
    deliveryType: "one-time",
    paymentMethod: "online" as "online" | "cod",
  });
  const [mobileValid, setMobileValid] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize mobile validation when profile loads
  useEffect(() => {
    if (formData.mobile) {
      const digits = formData.mobile.replace(/\D/g, "");
      const isValid = digits.length === 10 && /^[6-9]/.test(digits);
      setMobileValid(isValid);
    }
  }, [formData.mobile]);

  // Calculate convenience fee (1.5% for online payments)
  const CONVENIENCE_FEE_PERCENT = 1.5;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      toast({
        title: "Payment Error",
        description: "Failed to load payment gateway. Please refresh the page.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Pre-fill form with profile data
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.full_name || prev.name,
        mobile: profile.phone || prev.mobile,
        address: profile.address || prev.address,
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (preselectedProduct) {
      setFormData((prev) => ({ ...prev, product: preselectedProduct }));
    }
  }, [preselectedProduct]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuantityChange = (delta: number) => {
    const currentQuantity = parseInt(formData.quantity);
    const newQuantity = currentQuantity + delta;
    const maxQuantity = selectedProduct?.stock !== undefined ? selectedProduct.stock : 99; // Default max
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setFormData((prev) => ({ ...prev, quantity: newQuantity.toString() }));
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.product);
  const basePrice = selectedProduct
    ? Number(selectedProduct.price) * parseInt(formData.quantity || "1")
    : 0;
  const convenienceFee = formData.paymentMethod === "online"
    ? Math.round(basePrice * CONVENIENCE_FEE_PERCENT / 100)
    : 0;
  const totalPrice = basePrice + convenienceFee;

  const handlePaymentSuccess = async (
    response: RazorpayResponse,
    orderId: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
          orderId: orderId,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        if (formData.deliveryType === "daily" && selectedProduct && user) {
          // Create subscription record
          const { error: subError } = await (supabase as any).from("subscriptions").insert([{
            user_id: user.id,
            product_id: selectedProduct.id,
            quantity: parseInt(formData.quantity.toString()),
            frequency: "daily",
            start_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Starts tomorrow
            status: "active",
            delivery_address: formData.address
          }]);
          if (subError) console.error("Failed to create subscription:", subError);
        }
        navigate(`/payment-success?order_id=${orderId}`);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      toast({
        title: "Payment Verification Failed",
        description: "Your payment was received but verification failed. Please contact support.",
        variant: "destructive",
      });
      navigate(`/payment-cancelled?order_id=${orderId}`);
    }
  };

  const handleCODOrder = async () => {
    if (!user || !selectedProduct) {
      console.error("Missing user or selected product");
      return;
    }

    try {
      console.log("Processing COD order...");
      console.log("Selected product:", selectedProduct);

      // Skip profile update for now - proceed directly with order
      console.log("Skipping profile update, proceeding with order...");

      // Try edge function first, fallback to direct database
      let orderResult;
      try {
        const itemsPayload = [
          {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            price: Number(selectedProduct.price),
            quantity: parseInt(formData.quantity),
            unit: selectedProduct.unit,
          },
        ];

        console.log("Items payload:", itemsPayload);

        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            items: itemsPayload,
            deliveryType: formData.deliveryType,
            shippingAddress: formData.address,
            phone: formData.mobile,
            paymentMethod: "cod",
          },
        });

        if (error) {
          // Suppress 401 errors (authentication not configured for edge function) - fallback handles it
          if (error.status !== 401) {
            console.log("Edge function failed, using fallback:", error);
          }
          throw error;
        }

        // Check if order items insertion failed
        if (data?.itemsError) {
          console.error("⚠️ Items insertion failed:", data.itemsError);
          toast({
            title: "Warning",
            description: "Order created but product details could not be saved. Please contact support.",
            variant: "destructive",
          });
        }

        orderResult = data;
      } catch (edgeError) {
        console.log("Using direct database fallback for COD order");
        orderResult = await createOrderDirectly({
          items: [
            {
              id: selectedProduct.id,
              name: selectedProduct.name,
              description: selectedProduct.description,
              price: Number(selectedProduct.price),
              quantity: parseInt(formData.quantity),
              unit: selectedProduct.unit,
            },
          ],
          deliveryType: formData.deliveryType as "one-time" | "daily",
          shippingAddress: formData.address,
          phone: formData.mobile,
          paymentMethod: "cod",
        });

      }

      console.log("COD order result:", orderResult);

      if (!orderResult?.orderId) {
        throw new Error("No order ID received");
      }

      if (formData.deliveryType === "daily") {
        const { error: subError } = await (supabase as any).from("subscriptions").insert([{
          user_id: user.id,
          product_id: selectedProduct.id,
          quantity: parseInt(formData.quantity.toString()),
          frequency: "daily",
          start_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Starts tomorrow
          status: "active",
          delivery_address: formData.address
        }]);
        if (subError) console.error("Failed to create COD subscription:", subError);
      }

      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed. Pay ₹" + basePrice + " on delivery.",
      });
      navigate(`/payment-success?order_id=${orderResult.orderId}&cod=true`);
    } catch (err) {
      console.error("COD order error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast({
        title: "Order Failed",
        description: `Unable to place your order: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login or create an account to place an order",
        variant: "destructive",
      });
      navigate("/auth?redirect=/order");
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "Select a Product",
        description: "Please select a product to continue",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.address.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number using the PhoneInput validation
    if (!mobileValid) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit Indian mobile number",
        variant: "destructive",
      });
      return;
    }

    // Check delivery distance
    if (distanceError) {
      toast({
        title: "Outside Delivery Area",
        description: "We can only deliver within 65 km of our farm. Please enter a closer address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Inventory Validation Check
    if (selectedProduct.stock !== undefined && selectedProduct.stock < parseInt(formData.quantity)) {
      toast({
        title: "Out of Stock",
        description: `Sorry, we only have ${selectedProduct.stock} ${selectedProduct.unit}s of ${selectedProduct.name} remaining.`,
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    // Handle COD order
    if (formData.paymentMethod === "cod") {
      await handleCODOrder();
      setIsProcessing(false);
      return;
    }

    // Online payment - check Razorpay loaded
    if (!razorpayLoaded) {
      toast({
        title: "Payment Gateway Loading",
        description: "Please wait for the payment gateway to load",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Skip profile update for now - proceed directly with order
      console.log("Skipping profile update, proceeding with order...");

      console.log("Creating checkout session...");

      const itemsPayload = [
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: Number(selectedProduct.price),
          quantity: parseInt(formData.quantity),
          unit: selectedProduct.unit,
        },
      ];

      console.log("Items payload:", itemsPayload);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      let checkoutData;
      // Try edge function first, fallback to direct database
      try {
        // Use direct fetch to get detailed error body if needed
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`,
            "apikey": supabaseKey,
          },
          body: JSON.stringify({
            items: itemsPayload,
            deliveryType: formData.deliveryType,
            shippingAddress: formData.address,
            phone: formData.mobile,
            paymentMethod: "online",
            convenienceFee: convenienceFee,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Checkout edge function error response:", data);
          // Show more details if available
          if (data.error) console.error("Error message:", data.error);
          if (data.details) console.error("Error details:", data.details);
          if (data.stage) console.error("Error stage:", data.stage);

          throw new Error(data.error || "Failed to initialize checkout");
        }

        checkoutData = data;
      } catch (edgeFunctionError: any) {
        console.warn("Edge function failed or returned error, attempting fallback...", edgeFunctionError);

        // Fallback: Create order directly and create Razorpay order via API
        const orderResult = await createOrderDirectly({
          items: itemsPayload,
          deliveryType: formData.deliveryType as "one-time" | "daily",
          shippingAddress: formData.address,
          phone: formData.mobile,
          paymentMethod: "online",
          convenienceFee: convenienceFee,
        });

        const baseAmount = Number(selectedProduct.price) * parseInt(formData.quantity);
        const totalAmount = baseAmount + convenienceFee;

        // Create Razorpay order via dedicated edge function - use fetch for better error details
        const rzpResponse = await fetch(`${supabaseUrl}/functions/v1/create-razorpay-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
          },
          body: JSON.stringify({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: orderResult.orderId,
            notes: { order_id: orderResult.orderId }
          }),
        });

        const rzpData = await rzpResponse.json();

        if (!rzpResponse.ok) {
          console.error("Razorpay order creation error response (fallback):", rzpData);
          throw new Error(rzpData.error || "Failed to create Razorpay order during fallback");
        }

        checkoutData = {
          orderId: orderResult.orderId,
          razorpayOrderId: rzpData.id,
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SQJWiQh8bPWxdY",
          amount: totalAmount * 100,
          currency: "INR",
        };
      }

      // Check if order items insertion failed
      if (checkoutData?.itemsError) {
        console.error("⚠️ Items insertion failed:", checkoutData.itemsError);
        toast({
          title: "Warning",
          description: "Order created but product details could not be saved. Please contact support.",
          variant: "destructive",
        });
      }

      if (!checkoutData?.amount) {
        console.error("Missing checkout data:", checkoutData);
        throw new Error("Invalid checkout data");
      }

      console.log("DEBUG: VITE_RAZORPAY_KEY_ID from env:", import.meta.env.VITE_RAZORPAY_KEY_ID);
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SQJWiQh8bPWxdY";
      console.log("DEBUG: Final razorpayKeyId used:", razorpayKeyId);

      if (!razorpayKeyId) {
        console.error("Razorpay key not configured - this should not happen with fallback!");
        throw new Error("Payment gateway not configured. Please contact support.");
      }

      console.log("Opening Razorpay checkout...");

      // Update checkout data with key
      checkoutData.razorpayKeyId = razorpayKeyId;

      // Open Razorpay checkout with device-specific config
      // Note: Razorpay will create its own order ID if order_id is not provided
      const options: RazorpayOptions = {
        key: checkoutData.razorpayKeyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: "MMVALI Dairy Farm",
        description: `Order: ${selectedProduct.name} x ${formData.quantity}`,
        order_id: checkoutData.razorpayOrderId,
        handler: (response) => handlePaymentSuccess(response, checkoutData.orderId),
        prefill: {
          name: formData.name,
          email: user.email || "",
          contact: formData.mobile,
        },
        notes: {
          order_id: checkoutData.orderId,
        },
        theme: {
          color: "#16a34a", // Primary green color
        },
        modal: {
          ondismiss: async () => {
            setIsProcessing(false);
            console.log("Payment dismissed, marking order as cancelled:", checkoutData.orderId);
            
            // Mark order as cancelled if payment was not completed
            try {
              await supabase
                .from("orders")
                .update({ status: "cancelled", updated_at: new Date().toISOString() })
                .eq("id", checkoutData.orderId)
                .eq("status", "pending"); // Only if still pending
            } catch (err) {
              console.error("Error marking abandoned order as cancelled:", err);
            }

            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment. The order has been cancelled.",
            });
          },
        },
      };

      // On mobile: Only show UPI for direct payment app experience
      if (isMobile) {
        options.config = {
          display: {
            blocks: {
              banks: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        };
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      // Suppress 401 errors (authentication not configured for edge function) - fallback handles it
      if (!(err instanceof Error && err.message?.includes('401'))) {
        console.error("Checkout error:", err);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast({
        title: "Checkout Failed",
        description: `Unable to process your order: ${errorMessage}`,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <section className="section-padding min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-main text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Secure Checkout
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto animate-fade-in">
            Complete your order securely with Razorpay
          </p>
        </div>
      </section>

      {/* Order Form */}
      <section className="section-padding">
        <div className="container-main max-w-2xl mx-auto">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secured by Razorpay • 256-bit SSL Encryption</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-6 md:p-8 shadow-card"
          >
            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Delivery Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="mt-1"
                    maxLength={100}
                  />
                </div>
                <PhoneInput
                  value={formData.mobile}
                  onChange={(value, isValid) => {
                    handleChange("mobile", value);
                    setMobileValid(isValid);
                  }}
                />
                <AddressInput
                  value={formData.address}
                  onChange={(address, distance) => {
                    handleChange("address", address);
                    setDeliveryDistance(distance);
                  }}
                  onDistanceError={setDistanceError}
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Order Details
              </h2>
              {productsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product">Select Product</Label>
                      <Select
                        value={formData.product}
                        onValueChange={(value) => setFormData({ ...formData, product: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id} disabled={p.stock !== undefined && p.stock <= 0}>
                              {p.name} - ₹{p.price}/{p.unit}
                              {p.stock !== undefined && p.stock <= 0 ? " (Out of Stock)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity ({selectedProduct?.unit || "unit"})</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={parseInt(formData.quantity) <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={selectedProduct?.stock || "99"}
                          value={formData.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const max = selectedProduct?.stock || 99;
                            setFormData({ ...formData, quantity: Math.min(val, max).toString() });
                          }}
                          className="text-center w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={selectedProduct !== undefined && selectedProduct.stock !== undefined && parseInt(formData.quantity) >= selectedProduct.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {selectedProduct?.stock !== undefined && selectedProduct.stock < 10 && (
                          <span className="text-sm font-medium text-amber-600 ml-2 bg-amber-50 px-2 py-1 rounded-md animate-pulse">
                            Only {selectedProduct.stock} available!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Delivery Type *</Label>
                  <RadioGroup
                    value={formData.deliveryType}
                    onValueChange={(value) =>
                      handleChange("deliveryType", value)
                    }
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg flex-1 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label htmlFor="one-time" className="cursor-pointer flex-1">
                        <span className="font-medium">One-time Order</span>
                        <span className="block text-sm text-muted-foreground">
                          Single delivery
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg flex-1 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="cursor-pointer flex-1">
                        <span className="font-medium">Daily Subscription</span>
                        <span className="block text-sm text-muted-foreground">
                          Regular morning delivery
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="mb-3 block">Payment Method *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleChange("paymentMethod", value)
                    }
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className={`flex items-center space-x-2 p-4 border rounded-lg flex-1 cursor-pointer transition-colors ${formData.paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer flex-1">
                        <span className="font-medium">Pay Online</span>
                        <span className="block text-sm text-muted-foreground">
                          UPI, Cards, Net Banking
                          <span className="text-orange-600 ml-1">(+1.5% fee)</span>
                        </span>
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-4 border rounded-lg flex-1 cursor-pointer transition-colors ${formData.paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1">
                        <span className="font-medium">Cash on Delivery</span>
                        <span className="block text-sm text-muted-foreground">
                          Pay when delivered
                          <span className="text-green-600 ml-1">(No extra fee)</span>
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            {selectedProduct && (
              <div className="mb-8 p-4 bg-secondary/50 rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">Order Summary</h3>
                <div className="flex justify-between text-muted-foreground text-sm mb-1">
                  <span>
                    {selectedProduct.name} × {formData.quantity} {selectedProduct.unit}
                  </span>
                  <span>₹{basePrice}</span>
                </div>
                {formData.paymentMethod === "online" && convenienceFee > 0 && (
                  <div className="flex justify-between text-muted-foreground text-sm mb-1">
                    <span className="flex items-center gap-1">
                      Convenience Fee
                      <span className="text-xs text-orange-600">(1.5%)</span>
                    </span>
                    <span>₹{convenienceFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span className="text-xl text-primary">₹{totalPrice}</span>
                </div>
                {formData.paymentMethod === "cod" && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ No convenience fee for Cash on Delivery
                  </p>
                )}
              </div>
            )}

            {/* Payment Methods Info - Only show for online payment */}
            {formData.paymentMethod === "online" && (
              <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {isMobile ? "Pay with UPI" : "Accepted Payment Methods"}
                </h3>
                {isMobile ? (
                  /* Mobile: Show UPI payment apps */
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      Pay directly using your favorite UPI app
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg border border-border">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">PhonePe</div>
                        <span className="text-xs text-muted-foreground">PhonePe</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg border border-border">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">GPay</div>
                        <span className="text-xs text-muted-foreground">Google Pay</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-3 bg-background rounded-lg border border-border">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xs">Paytm</div>
                        <span className="text-xs text-muted-foreground">Paytm</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      + All other UPI apps supported
                    </p>
                  </div>
                ) : (
                  /* Desktop: Show all payment options */
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                      <span>Visa Cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                      <span>Mastercard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded text-white text-xs flex items-center justify-center font-bold">UPI</div>
                      <span>UPI Payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-green-600 to-green-700 rounded text-white text-xs flex items-center justify-center font-bold">NB</div>
                      <span>Net Banking</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COD Info */}
            {formData.paymentMethod === "cod" && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-lg">💵</span>
                  Cash on Delivery
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pay ₹{basePrice} in cash when your order is delivered. No advance payment required.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              size="xl"
              className="w-full"
              disabled={isProcessing || !selectedProduct || (formData.paymentMethod === "online" && !razorpayLoaded) || !!distanceError || !mobileValid}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : formData.paymentMethod === "cod" ? (
                <>
                  <span className="mr-2">📦</span>
                  Place Order (Pay ₹{basePrice} on Delivery)
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ₹{totalPrice} Securely
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {formData.paymentMethod === "online"
                ? "You'll be redirected to Razorpay's secure payment page"
                : "Your order will be confirmed and delivered to your address"}
            </p>

            {!user && (
              <p className="text-center text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => navigate("/auth?redirect=/order")}
                  className="text-primary font-medium hover:underline"
                >
                  Login or create an account
                </button>{" "}
                to place your order
              </p>
            )}
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Order;
