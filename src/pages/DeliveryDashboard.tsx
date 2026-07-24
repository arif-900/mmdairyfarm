import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Phone,
  Package,
  Navigation,
  CheckCircle2,
  Truck,
  Clock,
  Loader2,
  RefreshCw,
  LogOut,
  Bike,
  Search,
  ShoppingBag,
  IndianRupee,
  Calendar as CalendarIcon,
  History,
  Zap,
  ScanLine,
  HandCoins,
} from "lucide-react";
import { format, isSameDay, differenceInDays, isPast } from "date-fns";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OrderProgressStepper } from "@/components/delivery/OrderProgressStepper";
import { DeliveryStatsCard } from "@/components/delivery/DeliveryStatsCard";
const SmartScannerModal = lazy(() => import("@/components/shared/SmartScannerModal").then(m => ({ default: m.SmartScannerModal })));
import { SubscriptionsDeliveryList } from "@/components/delivery/SubscriptionsDeliveryList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  assigned_to?: string | null;
  is_cash_collected?: boolean;
  is_cash_settled?: boolean;
  delivery_otp?: string | null;
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
  selected_weight?: number | null;
  unit_type?: string | null;
  variant_label?: string | null;
}

type StatusFilter = "all" | "processing" | "picked_up" | "out_for_delivery" | "delivered";
type PaymentFilter = "all" | "cod" | "online";

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending", color: "bg-golden/15 text-golden-dark border-golden/20", icon: Clock },
    processing: { label: "Preparing", color: "bg-forest-light/10 text-forest border-forest-light/20", icon: Package },
    picked_up: { label: "Picked Up", color: "bg-forest/10 text-forest-dark border-forest/20", icon: Truck },
    out_for_delivery: { label: "On the Way", color: "bg-golden/15 text-golden-dark border-golden/20", icon: Navigation },
    delivered: { label: "Delivered", color: "bg-forest-light/15 text-forest border-forest-light/20", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "bg-rose-100/80 text-rose-700 border-rose-200/50", icon: LogOut },
  };
  const config = variants[status] || { label: status, color: "bg-earth-light/10 text-earth-light border-earth-light/20", icon: Package };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} backdrop-blur-md flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] font-bold text-[9px] tracking-widest uppercase shadow-sm`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const PaymentBadge = ({ method, isUnassigned }: { method: string; isUnassigned?: boolean }) => {
  const baseClass = "flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[9px] font-bold uppercase tracking-wider shadow-sm border";
  if (method === "cod") {
    return (
      <div className={cn(baseClass, isUnassigned ? "bg-golden/20 text-golden border-golden/20" : "bg-golden/10 text-golden-dark border-golden/20")}>
        <IndianRupee className="h-3 w-3" />
        Cash on Delivery
      </div>
    );
  }
  if (method === "online") {
    return (
      <div className={cn(baseClass, isUnassigned ? "bg-forest-light/20 text-forest-light border-forest-light/20" : "bg-forest-light/10 text-forest border-forest-light/20")}>
        <CheckCircle2 className="h-3 w-3" />
        Paid Online
      </div>
    );
  }
  return <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest rounded-[10px] px-3 py-1">{method}</Badge>;
};

const DeliveryDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<{ full_name: string; phone: string; settlement_requested: boolean } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerBalance, setLedgerBalance] = useState(0);
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, settlement_requested")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setProfile(data as any);
  };

  const fetchLedger = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("cod_ledger")
        .select("*")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLedgerEntries(data || []);

      // Calculate balance using the DB function for accuracy
      const { data: balance, error: balanceError } = await supabase
        .rpc("get_agent_cash_in_hand", { p_agent_id: user.id });

      if (balanceError) throw balanceError;
      setLedgerBalance(Number(balance || 0));
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await fetchLedger(); // Sync ledger first
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`assigned_to.eq.${user.id},and(status.eq.processing,assigned_to.is.null)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const ordersData = data || [];
      setOrders(ordersData);
      localStorage.setItem("cached_deliveries_orders", JSON.stringify(ordersData));

      if (ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsData) {
          const grouped: Record<string, OrderItem[]> = {};
          itemsData.forEach((item: any) => {
            if (!grouped[item.order_id]) grouped[item.order_id] = [];
            grouped[item.order_id].push(item);
          });
          setOrderItems(grouped);
          localStorage.setItem("cached_deliveries_items", JSON.stringify(grouped));
        }
      }
    } catch (err) {
      console.error("Error:", err);
      // Retrieve from cache if network fails
      const cachedOrders = localStorage.getItem("cached_deliveries_orders");
      const cachedItems = localStorage.getItem("cached_deliveries_items");
      if (cachedOrders) setOrders(JSON.parse(cachedOrders));
      if (cachedItems) setOrderItems(JSON.parse(cachedItems));
      
      toast({ title: "Offline Mode", description: "Showing cached offline routes.", variant: "default" });
    } finally {
      setLoading(false);
    }
  };

  const replayPendingUpdates = async () => {
    const queue = JSON.parse(localStorage.getItem("pending_delivery_updates") || "[]");
    if (queue.length === 0) return;

    toast({ title: "Network Restored", description: `Synchronizing ${queue.length} cached updates...` });

    const remainingQueue = [];
    for (const update of queue) {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const response = await fetch("/api/orders/status", {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ orderId: update.orderId, status: update.status }),
        });

        if (!response.ok) throw new Error("Update status failed");
      } catch (err) {
        remainingQueue.push(update);
      }
    }

    localStorage.setItem("pending_delivery_updates", JSON.stringify(remainingQueue));
    toast({ title: "Sync Complete", description: "Cached delivery status reports synced successfully." });
    fetchMyOrders();
  };

  useEffect(() => {
    fetchMyOrders();
    fetchProfile();

    const handleOnline = () => {
      setIsOffline(false);
      replayPendingUpdates();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const channel = supabase
      .channel("delivery-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (navigator.onLine) fetchMyOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cod_ledger", filter: `agent_id=eq.${user?.id}` }, () => {
        if (navigator.onLine) fetchLedger();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user?.id}` }, () => {
        if (navigator.onLine) fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user?.id]);

  const updateStatus = async (orderId: string, status: string, providedOtp?: string) => {
    const order = orders.find(o => o.id === orderId);

    // Security check for COD orders
    if (status === 'delivered' && order?.payment_method === 'cod' && !order?.is_cash_collected) {
      toast({
        title: "Confirm Cash Collection",
        description: "You must mark the cash as collected before completing this delivery.",
        variant: "destructive"
      });
      return;
    }

    // Only enforce OTP if it's NOT a COD order
    if (status === 'delivered' && order && order.delivery_otp && order.payment_method !== 'cod') {
      const entered = providedOtp?.trim() || "";
      const stored = order.delivery_otp?.trim() || "";

      if (entered !== stored) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect.",
          variant: "destructive"
        });
        return;
      }
    }

    if (!navigator.onLine || isOffline) {
      const queue = JSON.parse(localStorage.getItem("pending_delivery_updates") || "[]");
      queue.push({ orderId, status, timestamp: Date.now() });
      localStorage.setItem("pending_delivery_updates", JSON.stringify(queue));

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o))
      );
      toast({
        title: "Offline Update Cached",
        description: "Status changed. Will sync once signal is restored.",
      });
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const serviceUrl = "/api/orders/status";
      const response = await fetch(serviceUrl, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, status }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update status";
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = `Server Error (${response.status}): The request could not be completed.`;
        }

        throw new Error(errorMessage);
      }

      toast({ title: "✓ Status Updated", description: `Order marked as "${status.replace(/_/g, " ")}"` });
      fetchMyOrders();
    } catch (err: any) {
      console.error("Update error:", err);
      toast({ title: "Failed", description: err.message || "Could not update status", variant: "destructive" });
    }
  };

  const handleClaim = async (orderId: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const serviceUrl = "/api/orders/status";
      const response = await fetch(serviceUrl, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId,
          status: 'picked_up',
          metadata: { assigned_to: user?.id }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept order");
      }

      toast({ title: "✓ Order Accepted", description: "This order is now assigned to you" });
      fetchMyOrders();
    } catch (err: any) {
      console.error("Claim error:", err);
      toast({ title: "Failed", description: err.message || "Could not accept order", variant: "destructive" });
    }
  };

  const handleToggleCash = async (orderId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_cash_collected: !currentValue } as any)
        .eq("id", orderId);
      if (error) throw error;
      toast({ title: currentValue ? "Cash Uncollected" : "✓ Cash Collected", description: currentValue ? "Marked as not collected" : "Cash marked as received from customer" });
      fetchMyOrders();
    } catch {
      toast({ title: "Failed", description: "Could not update cash status", variant: "destructive" });
    }
  };

  const handleRegenerateOtp = async (orderId: string) => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_otp: newOtp } as any)
        .eq("id", orderId);
      if (error) throw error;
      toast({ title: "Code Regenerated", description: "New verification code has been generated. Customer can see it in their app." });
      fetchMyOrders();
    } catch {
      toast({ title: "Failed", description: "Could not regenerate code", variant: "destructive" });
    }
  };

  const handleScanResult = (decodedText: string) => {
    const scannedValue = decodedText.trim();

    // Helper to check if scanned text matches exact UUID or generated AWB Barcode
    const isMatch = (o: Order) => {
      if (o.id === scannedValue) return true;
      const mmAWB = `MM${o.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10).toUpperCase()}`;
      const fmppAWB = `FMPP${o.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10).toUpperCase()}`;
      if (mmAWB === scannedValue || fmppAWB === scannedValue) return true;
      return false;
    };

    const activeOrder = activeOrders.find(isMatch);
    if (activeOrder) {
      toast({ title: "Package Match Found", description: "Highlighting delivery instructions." });
      const elm = document.getElementById(`order-${activeOrder.id}`);
      if (elm) {
        elm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elm.classList.add("ring-4", "ring-primary", "animate-pulse");
        setTimeout(() => elm.classList.remove("ring-4", "ring-primary", "animate-pulse"), 2000);
      }
      return;
    }

    const poolOrder = availableOrders.find(isMatch);
    if (poolOrder) {
      toast({ title: "Found in Pool", description: `Task safely assigned to you!` });
      handleClaim(poolOrder.id);
      return;
    }

    const historyOrder = historyOrders.find(isMatch);
    if (historyOrder) {
      toast({ title: "Already Completed", description: `This package was already marked as ${historyOrder.status}.`, variant: "default" });
      return;
    }

    toast({ title: "Invalid Scan", description: "This package does not exist in your routes or the warehouse pool.", variant: "destructive" });
  };

  const handleSettlementRequest = async () => {
    if (!user || !settlementAmount || Number(settlementAmount) <= 0) return;

    setIsSubmittingSettlement(true);
    try {
      const amount = Number(settlementAmount);
      if (amount > ledgerBalance) {
        throw new Error("Cannot request more than your current Balance.");
      }

      const { error } = await supabase
        .from("cod_ledger")
        .insert({
          agent_id: user.id,
          amount: amount,
          type: "SETTLEMENT",
          status: "SUBMITTED",
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: `Successfully requested settlement for ₹${amount}. Hand over the physical cash to the office.`,
      });

      setIsSettlementModalOpen(false);
      setSettlementAmount("");
      fetchLedger();
    } catch (err: any) {
      toast({
        title: "Request Failed",
        description: err.message || "Failed to submit settlement request.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const openInMaps = (order: Order) => {
    if (order.shipping_lat && order.shipping_lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${order.shipping_lat},${order.shipping_lng}`, '_blank');
    } else {
      const cleanAddress = order.shipping_address.replace(/^MDR\d+\b\s*,?\s*/i, "");
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`, '_blank');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(query) ||
      order.phone.includes(query) ||
      order.shipping_address.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_method === paymentFilter;

    let matchesDate = true;
    if (selectedDate) {
      matchesDate = isSameDay(new Date(order.created_at), selectedDate);
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deliveredTodayCount = orders.filter(o =>
    o.assigned_to === user?.id &&
    o.status === 'delivered' &&
    new Date((o as any).updated_at || o.created_at) >= today
  ).length;

  const myPendingCount = orders.filter(o =>
    o.assigned_to === user?.id &&
    o.status !== 'delivered' &&
    o.status !== 'cancelled'
  ).length;

  const codCollectedTotal = filteredOrders
    .filter(o =>
      o.assigned_to === user?.id &&
      o.payment_method === 'cod' &&
      o.is_cash_collected === true
    )
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const cashInHand = ledgerBalance;
  const pendingSettlements = ledgerEntries
    .filter(e => e.type === 'SETTLEMENT' && e.status === 'SUBMITTED')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const availableOrders = filteredOrders.filter(o => !o.assigned_to);
  const activeOrders = filteredOrders.filter(o => o.assigned_to === user?.id && o.status !== 'delivered' && o.status !== 'cancelled');
  const historyOrders = filteredOrders.filter(o => o.assigned_to === user?.id && (o.status === 'delivered' || o.status === 'cancelled'));

  return (
    <div className="min-h-screen bg-cream pb-28 md:pb-24 relative overflow-x-hidden font-body">
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="sticky top-0 z-[60] bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-[10px] animate-pulse">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Offline Mode</p>
              <p className="text-sm font-bold opacity-90">Showing cached deliveries. Updates will sync automatically when online.</p>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Settlement Banner */}
      {profile?.settlement_requested && (
        <div className="sticky top-0 z-[60] bg-rose-600 text-white px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-[10px] animate-pulse">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Office Action Required</p>
              <p className="text-sm font-bold opacity-90">Please handover your collected cash to the office now.</p>
            </div>
          </div>
          <Button
            onClick={() => setIsSettlementModalOpen(true)}
            variant="outline"
            className="bg-white text-rose-600 border-none hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8 rounded-[10px]"
          >
            Handle Cash
          </Button>
        </div>
      )}

      {/* Ambient Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-forest/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-golden/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Dynamic Premium Header */}
      <header
        className={cn(
          "sticky top-0 z-50 bg-cream-dark/80 backdrop-blur-3xl border-b border-earth-light/20 transition-all duration-500",
          isScrolled ? "py-3 px-3 sm:px-6 shadow-md" : "py-5 px-3 sm:px-6 shadow-none"
        )}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div
              className={cn(
                "bg-gradient-to-br from-forest to-forest-dark rounded-[10px] flex items-center justify-center shadow-lg shadow-forest/20 ring-4 ring-forest/5 transition-all duration-500 shrink-0",
                isScrolled ? "w-9 h-9" : "w-12 h-12"
              )}
            >
              <Bike className={cn("text-white transition-all", isScrolled ? "h-4.5 w-4.5" : "h-6 w-6")} />
            </div>
            <div className="min-w-0">
              <h1 className={cn("font-display font-black text-earth tracking-tight leading-none mb-1 transition-all truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none", isScrolled ? "text-base" : "text-lg sm:text-2xl")}>
                {isScrolled ? "Today's Route" : (profile?.full_name || 'Partner')}
              </h1>
              {!isScrolled && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-forest-light/15 text-forest rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0">
                    Active
                  </span>
                  {profile?.phone && (
                    <span className="text-[10px] font-medium text-earth-light truncate">
                      {profile.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              className="rounded-[10px] w-10 h-10 bg-forest/10 text-forest hover:bg-forest/20 transition-all border border-forest/20 shadow-sm"
            >
              <ScanLine className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchMyOrders}
              className="rounded-[10px] w-10 h-10 hover:bg-earth-light/10 transition-all border border-earth-light/30"
            >
              <RefreshCw className={cn("h-4 w-4 text-earth", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-[10px] w-10 h-10 hover:bg-rose-50 hover:text-rose-600 transition-all border border-earth-light/30 hover:border-rose-100"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-8 space-y-6 md:space-y-8">
        {/* Metrics Integration - 2 col on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <DeliveryStatsCard
            title="Cash in Hand"
            value={`₹${cashInHand.toFixed(0)}`}
            label="Outstanding"
            icon={IndianRupee}
            variant="emerald"
          />
          <DeliveryStatsCard
            title="Submitted"
            value={`₹${pendingSettlements.toFixed(0)}`}
            label="Wait for Admin"
            icon={HandCoins}
            variant="amber"
          />
          <DeliveryStatsCard
            title="Done Today"
            value={deliveredTodayCount}
            label="Deliveries"
            icon={CheckCircle2}
            variant="primary"
          />
          <DeliveryStatsCard
            title="Pending Tasks"
            value={myPendingCount}
            label="To Do"
            icon={Clock}
            variant="slate"
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setIsSettlementModalOpen(true)}
            className="bg-forest hover:bg-forest-dark text-white font-bold px-6 md:px-8 h-12 md:h-14 rounded-[10px] shadow-lg shadow-forest/20 gap-2 uppercase tracking-widest text-xs w-full md:w-auto"
          >
            <HandCoins className="h-4 w-4 md:h-5 md:w-5" />
            Handover Cash to Office
          </Button>
        </div>

        {/* Tab-based Content with Sidebar Nav */}
        <Tabs defaultValue="available" className="w-full">
          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <TabsList className="hidden md:flex flex-col w-48 shrink-0 h-fit sticky top-28 bg-cream-dark/50 border border-earth-light/20 p-2 rounded-[10px] shadow-sm gap-1">
              <TabsTrigger
                value="available"
                className="w-full rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest gap-3 justify-start px-4 py-3"
              >
                <Zap className="h-4 w-4 shrink-0" />
                <span>Pool</span>
                {availableOrders.length > 0 && <span className="ml-auto bg-golden text-white px-1.5 py-0.5 rounded-full text-[10px]">{availableOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="w-full rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest gap-3 justify-start px-4 py-3"
              >
                <Truck className="h-4 w-4 shrink-0" />
                <span>Active</span>
                {activeOrders.length > 0 && <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{activeOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="w-full rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest gap-3 justify-start px-4 py-3"
              >
                <History className="h-4 w-4 shrink-0" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="w-full rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest gap-3 justify-start px-4 py-3"
              >
                <HandCoins className="h-4 w-4 shrink-0" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger
                value="subscriptions"
                className="w-full rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest gap-3 justify-start px-4 py-3"
              >
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span>Today's Route</span>
              </TabsTrigger>
            </TabsList>

            {/* Content Area */}
            <div className="flex-1 min-w-0 space-y-4 md:space-y-6">

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-light" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="w-full h-11 md:h-12 bg-white/80 border border-earth-light/30 rounded-[10px] pl-11 pr-4 text-sm font-medium text-earth placeholder:text-earth-light/60 focus:outline-none focus:ring-4 focus:ring-forest/10 focus:border-forest/30 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 md:h-12 rounded-[10px] text-[11px] font-bold border-earth-light/30 bg-white/80 min-w-[120px] md:min-w-[140px] uppercase tracking-wider shadow-sm justify-start",
                          !selectedDate && "text-earth-light"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[10px] border-earth-light/30 shadow-2xl" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                      {selectedDate && (
                        <div className="p-3 border-t border-earth-light/20 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-bold uppercase tracking-widest text-earth-light"
                            onClick={() => setSelectedDate(undefined)}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
                    <SelectTrigger className="h-11 md:h-12 rounded-[10px] text-[11px] font-bold border-earth-light/30 bg-white/80 min-w-[90px] md:min-w-[100px] uppercase tracking-wider shadow-sm">
                      <SelectValue placeholder="Pay" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px]">
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="cod">Cash</SelectItem>
                      <SelectItem value="online">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="available" className="mt-0">
                <OrderList
                  orders={availableOrders}
                  itemsMap={orderItems}
                  onClaim={handleClaim}
                  onOpenMap={openInMaps}
                  type="available"
                />
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                <OrderList
                  orders={activeOrders}
                  itemsMap={orderItems}
                  onUpdateStatus={updateStatus}
                  onToggleCash={handleToggleCash}
                  onRegenerateOtp={handleRegenerateOtp}
                  otpInputs={otpInputs}
                  setOtpInputs={setOtpInputs}
                  onOpenMap={openInMaps}
                  type="active"
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <OrderList
                  orders={historyOrders}
                  itemsMap={orderItems}
                  onOpenMap={openInMaps}
                  type="history"
                />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <LedgerList entries={ledgerEntries} />
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-0">
                <SubscriptionsDeliveryList date={selectedDate} />
              </TabsContent>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-earth-light/20 shadow-2xl">
            <TabsList className="w-full flex justify-around p-1 h-16 bg-transparent gap-0">
              <TabsTrigger value="available" className="flex-col gap-0.5 rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white px-1.5 py-1 h-full flex-1 font-bold text-[8px] uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                Pool
                {availableOrders.length > 0 && <span className="bg-golden text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center">{availableOrders.length > 9 ? '9+' : availableOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-col gap-0.5 rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white px-1.5 py-1 h-full flex-1 font-bold text-[8px] uppercase tracking-wider">
                <Truck className="h-4 w-4" />
                Active
                {activeOrders.length > 0 && <span className="bg-white/30 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center">{activeOrders.length > 9 ? '9+' : activeOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-col gap-0.5 rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white px-1.5 py-1 h-full flex-1 font-bold text-[8px] uppercase tracking-wider">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-col gap-0.5 rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white px-1.5 py-1 h-full flex-1 font-bold text-[8px] uppercase tracking-wider">
                <HandCoins className="h-4 w-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex-col gap-0.5 rounded-[10px] data-[state=active]:bg-forest data-[state=active]:text-white px-1.5 py-1 h-full flex-1 font-bold text-[8px] uppercase tracking-wider">
                <CalendarIcon className="h-4 w-4" />
                Route
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>

      {isScannerOpen && (
        <Suspense fallback={null}>
          <SmartScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScan={handleScanResult}
            title="Scan to Deliver"
            description="Point camera at the QR code/Barcode on the customer's parcel box."
          />
        </Suspense>
      )}

      {/* Settlement Request Modal */}
      <Dialog open={isSettlementModalOpen} onOpenChange={setIsSettlementModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-black flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-forest" />
              Handover Cash
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-earth-light">
              Request a settlement after physically handing over cash to the office.
              Your outstanding balance is <strong className="text-forest">₹{ledgerBalance.toFixed(0)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[9px] font-bold uppercase tracking-widest text-earth-light">
                Amount to Hand Over
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-earth-light text-lg">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="h-14 pl-10 rounded-[10px] border-2 border-earth-light/20 bg-cream/50 font-bold text-xl focus:border-forest/30 focus:ring-4 focus:ring-forest/5 transition-all"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                />
              </div>
              {Number(settlementAmount) > ledgerBalance && (
                <p className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Amount exceeds your current balance
                </p>
              )}
            </div>
            <div className="p-4 bg-forest/5 rounded-[10px] border border-forest/10">
              <p className="text-[9px] font-medium text-forest uppercase tracking-widest leading-relaxed">
                Only submit this request AFTER you have physically handed the cash to the admin or staff.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsSettlementModalOpen(false)}
              className="rounded-[10px] font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettlementRequest}
              disabled={!settlementAmount || Number(settlementAmount) <= 0 || Number(settlementAmount) > ledgerBalance || isSubmittingSettlement}
              className="bg-forest hover:bg-forest-dark text-white font-bold px-8 h-12 rounded-[10px] shadow-md shadow-forest/20 uppercase tracking-widest text-[10px]"
            >
              {isSubmittingSettlement ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OrderListProps {
  orders: Order[];
  itemsMap: Record<string, OrderItem[]>;
  onClaim?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string, otp?: string) => void;
  onToggleCash?: (id: string, current: boolean) => void;
  onRegenerateOtp?: (id: string) => void;
  otpInputs?: Record<string, string>;
  setOtpInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onOpenMap: (order: Order) => void;
  type: "available" | "active" | "history" | "payments";
}

const OrderList = ({ orders, itemsMap, onClaim, onUpdateStatus, onToggleCash, onRegenerateOtp, otpInputs, setOtpInputs, onOpenMap, type }: OrderListProps) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white/80 rounded-[10px] border-2 border-dashed border-earth-light/30 p-16 text-center">
        <Package className="h-12 w-12 text-earth-light/40 mx-auto mb-4" />
        <h3 className="text-earth font-display font-black text-lg tracking-tight">All Clear</h3>
        <p className="text-earth-light text-sm mt-1 mx-auto leading-tight font-medium">
          {type === 'available' ? "No orders in the pool right now." : type === 'active' ? "No active deliveries." : type === 'payments' ? "No payment history yet." : "No history found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order, index) => (
        <div id={`order-${order.id}`} key={order.id} className="transition-all duration-500 rounded-[10px]">
          <OrderCard
            order={order}
            items={itemsMap[order.id] || []}
            index={index}
            onClaim={onClaim}
            onUpdateStatus={onUpdateStatus}
            onToggleCash={onToggleCash}
            onRegenerateOtp={onRegenerateOtp}
            otpInput={otpInputs?.[order.id] || ''}
            setOtpInput={setOtpInputs ? (val) => setOtpInputs(prev => ({ ...prev, [order.id]: val })) : undefined}
            onOpenMap={onOpenMap}
            type={type}
          />
        </div>
      ))}
    </div>
  );
};

const OrderCard = ({
  order,
  items,
  index,
  onClaim,
  onUpdateStatus,
  onToggleCash,
  onRegenerateOtp,
  otpInput,
  setOtpInput,
  onOpenMap,
}: any) => {
  const isUnassigned = !order.assigned_to;
  const isCOD = order.payment_method === 'cod';

  return (
    <Card
      className={cn(
        "overflow-hidden border-none shadow-soft rounded-[10px] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8",
        isUnassigned ? "bg-forest-dark text-white" : "bg-white"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-5 md:p-6 space-y-4 md:space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isUnassigned ? "bg-golden shadow-lg shadow-golden/40" : "bg-forest")} />
              <p className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-earth-light">
                UNIT #{order.id.slice(0, 6).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-earth-light" />
              <span className={cn("text-sm font-display font-bold tracking-tight", isUnassigned ? "text-cream-dark" : "text-earth")}>
                {format(new Date(order.created_at), "dd MMM · h:mm a")}
              </span>
            </div>

            {(order as any).expected_delivery_date && (
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2">
                  <Truck className={cn("h-3.5 w-3.5", isUnassigned ? "text-golden" : "text-forest")} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", isUnassigned ? "text-cream-dark/70" : "text-earth-light")}>
                    Deadline: {format(new Date((order as any).expected_delivery_date), "dd MMM")}
                  </span>
                </div>
                {(() => {
                  const deadline = new Date((order as any).expected_delivery_date);
                  const diff = differenceInDays(deadline, new Date());
                  const overdue = isPast(deadline) && !isSameDay(deadline, new Date());

                  return (
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-[9px] font-bold uppercase tracking-wider scale-90 -ml-2",
                      overdue ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-forest-light/15 text-forest"
                    )}>
                      {overdue ? <AlertCircle className="h-3 w-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-forest" />}
                      {overdue ? `Overdue by ${Math.abs(diff)} days` : diff === 0 ? "Delivering Today" : `${diff} days remaining`}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={order.status} />
            {(() => {
              const pendingQueue = JSON.parse(localStorage.getItem("pending_delivery_updates") || "[]");
              const isSyncPending = pendingQueue.some((q: any) => q.orderId === order.id);
              if (isSyncPending) {
                return (
                  <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[10px] animate-pulse">
                    Sync Pending
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {!isUnassigned && order.status !== 'cancelled' && (
          <OrderProgressStepper status={order.status} />
        )}

        <div className={cn("rounded-[10px] p-5 space-y-5", isUnassigned ? "bg-white/5 border border-white/10" : "bg-cream/50 border border-cream-dark/30")}>
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <PaymentBadge method={order.payment_method || ''} isUnassigned={isUnassigned} />
            <div className="text-right">
              <div className="flex items-center gap-1 leading-none">
                <span className={cn("text-xs font-bold", isUnassigned ? "text-golden" : "text-forest")}>₹</span>
                <span className={cn("text-2xl font-display font-black tracking-tight", isUnassigned ? "text-white" : "text-earth")}>
                  {Number(order.total_amount).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 group cursor-pointer" onClick={() => onOpenMap(order)}>
              <div className={cn("w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", isUnassigned ? "bg-white/10 text-white" : "bg-white border border-earth-light/20 text-earth")}>
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-earth-light mb-0.5">Delivery Address</p>
                <p className={cn("text-sm font-display font-bold leading-snug tracking-tight", isUnassigned ? "text-white" : "text-earth")}>
                  {order.shipping_address}
                </p>
                <div className={cn("flex items-center gap-1.5 mt-1 text-[9px] font-bold uppercase tracking-widest", isUnassigned ? "text-golden" : "text-forest")}>
                  <Navigation className="h-3 w-3" />
                  Navigate
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className={cn("w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 shadow-sm", isUnassigned ? "bg-golden/20 text-golden" : "bg-forest-light/10 text-forest border border-forest-light/20")}>
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-earth-light mb-0.5">Customer</p>
                <p className={cn("text-sm font-display font-bold leading-none mb-0.5", isUnassigned ? "text-white" : "text-earth")}>
                  {order.user_name || "Guest Customer"}
                </p>
                <a href={`tel:${order.phone}`} className={cn("text-base font-bold tracking-tight hover:underline", isUnassigned ? "text-golden" : "text-forest")}>
                  {order.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2 text-earth-light">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Items</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item: any) => (
                <div key={item.id} className={cn("px-3 py-1.5 rounded-[10px] border text-[11px] font-medium flex flex-col gap-0.5", isUnassigned ? "bg-white/5 border-white/10 text-cream-dark" : "bg-white border-earth-light/20 text-earth")}>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("font-bold", isUnassigned ? "text-golden" : "text-forest")}>×{item.quantity}</span>
                    <span>{item.product_name}</span>
                    {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                      <span className="opacity-60 text-[0.9em]">
                        ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                      </span>
                    )}
                  </div>
                  {item.delivery_days > 0 && (
                    <div className="text-[8px] font-bold uppercase text-forest flex items-center gap-1 opacity-80">
                      <Truck className="w-2 h-2" />
                      {item.delivery_days} {item.delivery_days === 1 ? 'day' : 'days'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isCOD && !isUnassigned && order.status !== 'cancelled' && (
          <div className={cn(
            "rounded-[10px] p-5 transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
            order.is_cash_collected
              ? "bg-forest-light/8 border border-forest-light/20"
              : "bg-golden/10 border border-golden/20"
          )}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className={cn("h-3.5 w-3.5", order.is_cash_collected ? "text-forest" : "text-golden-dark")} />
                <p className={cn("text-[9px] font-bold uppercase tracking-widest", order.is_cash_collected ? "text-forest" : "text-golden-dark")}>
                  {order.is_cash_collected ? "Payment Collected" : "Cash Due"}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className={cn("text-xl font-display font-black tracking-tight", order.is_cash_collected ? "text-earth" : "text-earth")}>
                  ₹{Number(order.total_amount).toFixed(0)}
                </p>
                {order.shipping_fee > 0 && (
                  <p className={cn("text-[9px] font-medium opacity-60", order.is_cash_collected ? "text-earth" : "text-earth")}>
                    (incl. ₹{order.shipping_fee} fee)
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={() => onToggleCash?.(order.id, !!order.is_cash_collected)}
                disabled={order.is_cash_settled}
                className={cn(
                  "rounded-[10px] px-6 h-10 font-bold text-[10px] uppercase tracking-[0.1em] transition-all active:scale-95 w-full sm:w-auto",
                  order.is_cash_collected
                    ? "bg-forest-light/15 text-forest hover:bg-forest-light/25"
                    : "bg-golden hover:bg-golden-dark text-white shadow-md shadow-golden/20"
                )}
              >
                {order.is_cash_collected ? "Rollback" : "I've Collected Cash"}
              </Button>
              {order.is_cash_collected && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                  order.is_cash_settled
                    ? "bg-forest-light/10 text-forest border-forest-light/20"
                    : "bg-golden/10 text-golden-dark border-golden/20 animate-pulse"
                )}>
                  {order.is_cash_settled ? "Handed to Admin" : "Handover Pending"}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-1 space-y-3">
          {isUnassigned ? (
            <div className="flex justify-center">
              <Button
                onClick={() => onClaim(order.id)}
                className="bg-golden hover:bg-golden-dark text-earth h-12 rounded-[10px] font-bold text-sm tracking-[0.15em] shadow-md shadow-golden/20 transition-all uppercase px-8"
              >
                Accept Delivery Task
              </Button>
            </div>
          ) : order.status === 'delivered' ? (
            <div className="bg-forest-light/8 rounded-[10px] py-5 flex flex-col items-center border border-forest-light/20 border-dashed animate-in zoom-in duration-500">
              <CheckCircle2 className="h-7 w-7 text-forest mb-1" />
              <p className="text-forest font-bold text-[10px] uppercase tracking-widest">Delivered Successfully</p>
            </div>
          ) : (
            <div className="space-y-3">
              {['pending', 'paid'].includes(order.status as any) && (
                <div className="flex justify-center">
                  <Button className="bg-forest hover:bg-forest-dark h-12 px-8 rounded-[10px] text-white font-bold text-sm tracking-[0.15em] shadow-md shadow-forest/20 transition-all"
                    onClick={() => onUpdateStatus(order.id, 'processing')}>
                    <Package className="h-4 w-4 mr-2" />
                    SET TO PREPARING
                  </Button>
                </div>
              )}
              {order.status === 'processing' && (
                <div className="flex justify-center">
                  <Button className="bg-earth hover:bg-earth/90 h-12 px-8 rounded-[10px] text-white font-bold text-sm tracking-[0.15em] shadow-md shadow-earth/20 transition-all"
                    onClick={() => onUpdateStatus(order.id, 'picked_up')}>
                    <Truck className="h-4 w-4 mr-2" />
                    CONFIRM PICKUP
                  </Button>
                </div>
              )}
              {order.status === 'picked_up' && (
                <div className="flex justify-center">
                  <Button className="bg-forest hover:bg-forest-dark h-12 px-8 rounded-[10px] text-white font-bold text-sm tracking-[0.15em] shadow-md shadow-forest/20 transition-all"
                    onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}>
                    <Navigation className="h-4 w-4 mr-2" />
                    START DEPARTURE
                  </Button>
                </div>
              )}
              {order.status === 'out_for_delivery' && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  {order.payment_method !== 'cod' ? (
                    <div className="bg-cream/50 rounded-[10px] p-5 border border-forest/10 space-y-3">
                      <Label className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-light block text-center">Verify OTP</Label>
                      <div className="flex gap-2 justify-center">
                        <Input
                          placeholder="······"
                          className="h-14 w-[160px] rounded-[10px] border-none bg-white shadow-md text-center text-2xl font-bold tracking-[0.3em] focus:ring-4 focus:ring-forest/10 transition-all font-mono"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-14 w-14 rounded-[10px] border border-earth-light/20 bg-white shadow-sm active:scale-90 transition-all"
                          onClick={() => onRegenerateOtp(order.id)}
                        >
                          <RefreshCw className="h-5 w-5 text-forest" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-forest-light/8 rounded-[10px] p-5 border border-forest-light/20 border-dashed text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-forest">COD — No OTP Needed</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      className="bg-forest hover:bg-forest-dark h-12 px-8 rounded-[10px] text-white font-bold text-sm tracking-[0.15em] shadow-md shadow-forest/20 transition-all"
                      onClick={() => onUpdateStatus(order.id, 'delivered', otpInput)}
                    >
                      {order.payment_method === 'cod' ? "COMPLETE DELIVERY" : "VERIFY & FINISH"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LedgerList = ({ entries }: { entries: any[] }) => {
  if (entries.length === 0) {
    return (
      <div className="bg-white/80 rounded-[10px] border-2 border-dashed border-earth-light/30 p-16 text-center">
        <HandCoins className="h-12 w-12 text-earth-light/40 mx-auto mb-4" />
        <h3 className="text-earth font-display font-black text-lg tracking-tight">No Transactions</h3>
        <p className="text-earth-light text-sm mt-1 mx-auto leading-tight font-medium">
          Your financial history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="overflow-hidden border-earth-light/20 shadow-soft rounded-[10px] hover:shadow-card transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0",
                entry.type === 'COLLECTION' ? "bg-forest-light/10 text-forest" : "bg-golden/10 text-golden-dark"
              )}>
                {entry.type === 'COLLECTION' ? <Package className="h-5 w-5" /> : <HandCoins className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-display font-bold text-earth leading-none mb-0.5">
                  {entry.type === 'COLLECTION' ? "COD Collection" : "Cash Handover"}
                </p>
                <p className="text-[9px] font-medium text-earth-light flex items-center gap-2">
                  <span>{format(new Date(entry.created_at), "dd MMM · HH:mm")}</span>
                  {entry.order_id && <span>· #{entry.order_id.slice(0, 8).toUpperCase()}</span>}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-display font-black tracking-tight",
                entry.type === 'COLLECTION' ? "text-forest" : "text-golden-dark"
              )}>
                {entry.type === 'COLLECTION' ? "+" : "-"}₹{Number(entry.amount).toFixed(0)}
              </p>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                entry.status === 'VERIFIED' ? "bg-forest-light/15 text-forest" :
                  entry.status === 'SUBMITTED' ? "bg-golden/15 text-golden-dark animate-pulse" :
                    "bg-earth-light/10 text-earth-light"
              )}>
                {entry.status === 'VERIFIED' ? "Verified" :
                  entry.status === 'SUBMITTED' ? "Pending Verification" :
                    "In Hand"}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DeliveryDashboard;
