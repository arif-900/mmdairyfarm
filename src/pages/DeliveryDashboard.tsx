import { useState, useEffect } from "react";
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
import { SmartScannerModal } from "@/components/shared/SmartScannerModal";
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
        pending: { label: "Pending", color: "bg-amber-100/80 text-amber-700 border-amber-200/50", icon: Clock },
        processing: { label: "Preparing", color: "bg-blue-100/80 text-blue-700 border-blue-200/50", icon: Package },
        picked_up: { label: "Picked Up", color: "bg-indigo-100/80 text-indigo-700 border-indigo-200/50", icon: Truck },
        out_for_delivery: { label: "On the Way", color: "bg-orange-100/80 text-orange-700 border-orange-200/50", icon: Navigation },
        delivered: { label: "Delivered", color: "bg-emerald-100/80 text-emerald-700 border-emerald-200/50", icon: CheckCircle2 },
        cancelled: { label: "Cancelled", color: "bg-rose-100/80 text-rose-700 border-rose-200/50", icon: LogOut },
    };
    const config = variants[status] || { label: status, color: "bg-slate-100/80 text-slate-700 border-slate-200/50", icon: Package };
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={`${config.color} backdrop-blur-md flex items-center gap-1.5 px-3 py-1 rounded-2xl border-2 font-black text-[10px] tracking-widest uppercase shadow-sm`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

const PaymentBadge = ({ method, isUnassigned }: { method: string; isUnassigned?: boolean }) => {
    const baseClass = "flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border";
    if (method === "cod") {
        return (
            <div className={cn(baseClass, isUnassigned ? "bg-amber-500/20 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200")}>
                <span>💵 Cash on Delivery</span>
            </div>
        );
    }
    if (method === "online") {
        return (
            <div className={cn(baseClass, isUnassigned ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-800 border-emerald-200")}>
                <span>✅ Paid Online</span>
            </div>
        );
    }
    return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-1">{method}</Badge>;
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
                }
            }
        } catch (err) {
            console.error("Error:", err);
            toast({ title: "Error", description: "Failed to load deliveries", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOrders();
        fetchProfile();
        const channel = supabase
            .channel("delivery-updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
                fetchMyOrders();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "cod_ledger", filter: `agent_id=eq.${user?.id}` }, () => {
                fetchLedger();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user?.id}` }, () => {
                fetchProfile();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
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

        try {
            const serviceUrl = "/api/orders/status";
            const response = await fetch(serviceUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
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
            const serviceUrl = "/api/orders/status";
            const response = await fetch(serviceUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
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
        <div className="min-h-screen bg-[#f8fafc] pb-24 relative overflow-x-hidden font-sans">
            {/* Urgent Settlement Banner */}
            {profile?.settlement_requested && (
              <div className="sticky top-0 z-[60] bg-rose-600 text-white px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Office Action Required</p>
                    <p className="text-sm font-bold opacity-90">Please handover your collected cash to the office now.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsSettlementModalOpen(true)}
                  variant="outline" 
                  className="bg-white text-rose-600 border-none hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8"
                >
                  Handle Cash
                </Button>
              </div>
            )}

            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Dynamic Premium Header */}
            <header 
              className={cn(
                "sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b border-slate-200/50 transition-all duration-500",
                isScrolled ? "py-4 px-6 shadow-md" : "py-8 px-6 shadow-none"
              )}
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div 
                          className={cn(
                            "bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-primary/5 transition-all duration-500",
                            isScrolled ? "w-10 h-10" : "w-14 h-14"
                          )}
                        >
                            <Bike className={cn("text-white transition-all", isScrolled ? "h-5 w-5" : "h-7 w-7")} />
                        </div>
                        <div>
                            <h1 className={cn("font-black text-slate-900 tracking-tight leading-none mb-1 transition-all", isScrolled ? "text-lg" : "text-xl")}>
                                {isScrolled ? "Today's Route" : (profile?.full_name || 'Partner')}
                            </h1>
                            {!isScrolled && (
                              <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                      Active Now
                                  </span>
                                  {profile?.phone && (
                                      <span className="text-xs font-bold text-slate-500">
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
                          className="rounded-xl w-10 h-10 bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-sm"
                      >
                          <ScanLine className="h-5 w-5" />
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={fetchMyOrders}
                          className="rounded-xl w-10 h-10 hover:bg-slate-100 transition-all border border-slate-200/50"
                      >
                          <RefreshCw className={cn("h-4 w-4 text-slate-600", loading && "animate-spin")} />
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleSignOut} 
                          className="rounded-xl w-10 h-10 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200/50 hover:border-rose-100"
                      >
                          <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
                {/* Metrics Integration */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 gap-2 uppercase tracking-widest text-xs"
                    >
                        <HandCoins className="h-5 w-5" />
                        Handle Cash to Office
                    </Button>
                </div>

                {/* Main Action Tabs */}
                <Tabs defaultValue="available" className="w-full space-y-6">
                  <TabsList className="w-full bg-white border border-slate-200 p-1.5 h-auto md:h-16 rounded-[24px] shadow-sm grid grid-cols-3 md:grid-cols-5 gap-1">
                    <TabsTrigger 
                      value="available" 
                      className="rounded-[18px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span className="hidden sm:inline">Pool</span>
                      {availableOrders.length > 0 && <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{availableOrders.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="active" 
                      className="rounded-[18px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Active</span>
                      {activeOrders.length > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{activeOrders.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history" 
                      className="rounded-[18px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <History className="h-4 w-4" />
                      <span className="hidden sm:inline">History</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="payments" 
                      className="rounded-[18px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <HandCoins className="h-4 w-4" />
                      <span className="hidden sm:inline">Payments</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="subscriptions" 
                      className="rounded-[18px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Today's Route</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                          type="text"
                          placeholder="Search..."
                          className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
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
                                      "h-12 rounded-2xl text-[11px] font-black border-slate-200/80 bg-white min-w-[140px] uppercase tracking-wider shadow-sm justify-start",
                                      !selectedDate && "text-slate-500"
                                  )}
                              >
                                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                  {selectedDate ? format(selectedDate, "PPP") : <span>Date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-3xl border-slate-200 shadow-2xl" align="end">
                              <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                              />
                              {selectedDate && (
                                  <div className="p-3 border-t border-slate-100 flex justify-center">
                                      <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                          onClick={() => setSelectedDate(undefined)}
                                      >
                                          Clear
                                      </Button>
                                  </div>
                              )}
                          </PopoverContent>
                      </Popover>
                      <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
                          <SelectTrigger className="h-12 rounded-2xl text-[11px] font-black border-slate-200/80 bg-white min-w-[100px] uppercase tracking-wider shadow-sm">
                              <SelectValue placeholder="Pay" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
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
                </Tabs>
            </main>

            <SmartScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
                title="Scan to Deliver"
                description="Point camera at the QR code/Barcode on the customer's parcel box."
            />

            {/* Settlement Request Modal */}
            <Dialog open={isSettlementModalOpen} onOpenChange={setIsSettlementModalOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-primary" />
                    Handover Cash
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-slate-500">
                    Request a settlement after physically handing over cash to the office. 
                    Your outstanding balance is <strong>₹{ledgerBalance.toFixed(0)}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Amount to Hand Over
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₹</span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="h-14 pl-10 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-xl focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(e.target.value)}
                      />
                    </div>
                    {Number(settlementAmount) > ledgerBalance && (
                      <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Amount exceeds your current balance
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                      ⚠️ Note: Only submit this request AFTER you have physically handed the cash to the admin or staff.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSettlementModalOpen(false)}
                    className="rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSettlementRequest}
                    disabled={!settlementAmount || Number(settlementAmount) <= 0 || Number(settlementAmount) > ledgerBalance || isSubmittingSettlement}
                    className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px]"
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
      <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-16 text-center">
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-slate-700 font-bold uppercase tracking-tight">Empty List</h3>
          <p className="text-slate-400 text-sm mt-1 mx-auto leading-tight">
              {type === 'available' ? "No orders ready." : type === 'active' ? "No active jobs." : type === 'payments' ? "No COD history." : "No history found."}
          </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order, index) => (
        <div id={`order-${order.id}`} key={order.id} className="transition-all duration-500 rounded-3xl">
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
        "overflow-hidden border-none shadow-xl rounded-[40px] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8",
        isUnassigned ? "bg-slate-900 text-white" : "bg-white"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isUnassigned ? "bg-emerald-400 shadow-lg shadow-emerald-400/40" : "bg-primary")} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                UNIT #{order.id.slice(0, 6).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className={cn("text-sm font-black tracking-tight", isUnassigned ? "text-slate-200" : "text-slate-900")}>
                {format(new Date(order.created_at), "dd MMM · h:mm a")}
              </span>
            </div>
            
            {(order as any).expected_delivery_date && (
              <div className="flex flex-col gap-1 mt-3">
                <div className="flex items-center gap-2">
                  <Truck className={cn("h-4 w-4", isUnassigned ? "text-emerald-400" : "text-primary")} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", isUnassigned ? "text-slate-400" : "text-slate-500")}>
                    Deadline: {format(new Date((order as any).expected_delivery_date), "dd MMM")}
                  </span>
                </div>
                {(() => {
                  const deadline = new Date((order as any).expected_delivery_date);
                  const diff = differenceInDays(deadline, new Date());
                  const overdue = isPast(deadline) && !isSameDay(deadline, new Date());
                  
                  return (
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-[10px] font-black uppercase tracking-wider scale-90 -ml-2",
                      overdue ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {overdue ? <AlertCircle className="w-3 w-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {overdue ? `Overdue by ${Math.abs(diff)} days` : diff === 0 ? "Delivering Today" : `${diff} days remaining`}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <StatusBadge status={order.status} />
        </div>

        {!isUnassigned && order.status !== 'cancelled' && (
          <OrderProgressStepper status={order.status} />
        )}

        <div className={cn("rounded-[32px] p-6 space-y-6 shadow-inner", isUnassigned ? "bg-white/5 border border-white/10" : "bg-slate-50/50 border border-slate-100")}>
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <PaymentBadge method={order.payment_method || ''} isUnassigned={isUnassigned} />
            <div className="text-right">
              <div className="flex items-center gap-1 leading-none">
                <span className={cn("text-xs font-black", isUnassigned ? "text-emerald-400" : "text-primary")}>₹</span>
                <span className={cn("text-3xl font-black tracking-tighter", isUnassigned ? "text-white" : "text-slate-900")}>
                  {Number(order.total_amount).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 group cursor-pointer" onClick={() => onOpenMap(order)}>
              <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", isUnassigned ? "bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-600")}>
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Address</p>
                <p className={cn("text-base font-black leading-tight tracking-tight", isUnassigned ? "text-white" : "text-slate-900")}>
                  {order.shipping_address}
                </p>
                <div className={cn("flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest", isUnassigned ? "text-emerald-400" : "text-primary")}>
                  <Navigation className="h-3.5 w-3.5" />
                  Route Navigation
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm", isUnassigned ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600 border border-emerald-100")}>
                <Phone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Customer</p>
                <p className={cn("text-sm font-black uppercase tracking-tight leading-none mb-1", isUnassigned ? "text-white" : "text-slate-800")}>
                  {order.user_name || "Guest Customer"}
                </p>
                <a href={`tel:${order.phone}`} className={cn("text-lg font-black tracking-tighter hover:underline", isUnassigned ? "text-white" : "text-slate-900")}>
                  {order.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Loadout</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item: any) => (
                <div key={item.id} className={cn("px-3 py-1.5 rounded-xl border text-[11px] font-bold flex flex-col gap-0.5", isUnassigned ? "bg-white/5 border-white/10 text-slate-300" : "bg-white border-slate-200 text-slate-700")}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-black">×{item.quantity}</span>
                    <span>{item.product_name}</span>
                    {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                      <span className="opacity-60 text-[0.9em]">
                        ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                      </span>
                    )}
                  </div>
                  {item.delivery_days > 0 && (
                    <div className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1 opacity-80">
                      <Truck className="w-2.5 h-2.5" />
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
            "rounded-[28px] p-6 transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2",
            order.is_cash_collected 
              ? "bg-emerald-50/50 border-emerald-100 shadow-none" 
              : "bg-amber-100/50 border-amber-200 shadow-xl shadow-amber-500/5"
          )}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className={cn("h-4 w-4", order.is_cash_collected ? "text-emerald-600" : "text-amber-600")} />
                <p className={cn("text-[10px] font-black uppercase tracking-widest", order.is_cash_collected ? "text-emerald-600" : "text-amber-600")}>
                  {order.is_cash_collected ? "Payment Verified" : "Due from Customer"}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className={cn("text-2xl font-black tracking-tighter", order.is_cash_collected ? "text-emerald-950" : "text-amber-950")}>
                  ₹{Number(order.total_amount).toFixed(0)}
                </p>
                {order.shipping_fee > 0 && (
                  <p className={cn("text-[10px] font-bold opacity-60", order.is_cash_collected ? "text-emerald-800" : "text-amber-800")}>
                    (Includes ₹{order.shipping_fee} fee)
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button 
                onClick={() => onToggleCash?.(order.id, !!order.is_cash_collected)}
                disabled={order.is_cash_settled}
                className={cn(
                  "rounded-[20px] px-8 h-12 font-black text-xs uppercase tracking-[0.1em] transition-all active:scale-95 w-full sm:w-auto",
                  order.is_cash_collected 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                )}
              >
                {order.is_cash_collected ? "Rollback" : "I've Collected Cash"}
              </Button>
              {order.is_cash_collected && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  order.is_cash_settled 
                    ? "bg-blue-50 text-blue-600 border-blue-100" 
                    : "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                )}>
                  {order.is_cash_settled ? "Handed to Admin" : "Handover Pending"}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          {isUnassigned ? (
            <Button 
               onClick={() => onClaim(order.id)}
               className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 h-16 rounded-[28px] font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-400/20 border-b-4 border-emerald-600 active:translate-y-1 active:border-b-0 transition-all uppercase"
            >
              Accept Delivery Task
            </Button>
          ) : order.status === 'delivered' ? (
            <div className="bg-emerald-50 rounded-[28px] py-6 flex flex-col items-center border border-emerald-200 border-dashed animate-in zoom-in duration-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-emerald-800 font-black text-xs uppercase tracking-widest">Job Successfully Completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {['pending', 'paid'].includes(order.status as any) && (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[28px] text-white font-black text-sm tracking-[0.2em] shadow-xl shadow-blue-500/20 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                      onClick={() => onUpdateStatus(order.id, 'processing')}>
                      <Package className="h-5 w-5 mr-3" />
                      SET TO PREPARING
                  </Button>
              )}
              {order.status === 'processing' && (
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 h-16 rounded-[28px] text-white font-black text-sm tracking-[0.2em] shadow-xl shadow-slate-900/20 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 transition-all"
                      onClick={() => onUpdateStatus(order.id, 'picked_up')}>
                      <Truck className="h-5 w-5 mr-3" />
                      CONFIRM PICKUP
                  </Button>
              )}
              {order.status === 'picked_up' && (
                  <Button className="w-full bg-primary hover:bg-primary/90 h-16 rounded-[28px] text-white font-black text-sm tracking-[0.2em] shadow-xl shadow-primary/20 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
                      onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}>
                      <Navigation className="h-5 w-5 mr-3" />
                      START DEPARTURE
                  </Button>
              )}
              {order.status === 'out_for_delivery' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    {order.payment_method !== 'cod' ? (
                      <div className="bg-slate-50 rounded-[32px] p-6 border-2 border-primary/20 space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block text-center">Verify Completion OTP</Label>
                          <div className="flex gap-3 justify-center">
                              <Input 
                                  placeholder="······" 
                                  className="h-16 w-[180px] rounded-2xl border-none bg-white shadow-xl text-center text-3xl font-black tracking-[0.4em] focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                  maxLength={6}
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value)}
                              />
                              <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-16 w-16 rounded-2xl border border-slate-200 bg-white shadow-lg active:scale-90 transition-all"
                                  onClick={() => onRegenerateOtp(order.id)}
                              >
                                  <RefreshCw className="h-6 w-6 text-primary" />
                              </Button>
                          </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-200 border-dashed text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">COD Order — No Verification Needed</p>
                      </div>
                    )}
                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[32px] text-white font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-600/30 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
                        onClick={() => onUpdateStatus(order.id, 'delivered', otpInput)}
                    >
                        {order.payment_method === 'cod' ? "COMPLETE DELIVERY" : "VERIFY & FINISH"}
                    </Button>
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
      <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-16 text-center">
          <HandCoins className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-slate-700 font-bold uppercase tracking-tight">No Transactions</h3>
          <p className="text-slate-400 text-sm mt-1 mx-auto leading-tight">
              Your financial history will appear here.
          </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="overflow-hidden border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                entry.type === 'COLLECTION' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              )}>
                {entry.type === 'COLLECTION' ? <Package className="h-6 w-6" /> : <HandCoins className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-black text-slate-900 leading-none mb-1">
                  {entry.type === 'COLLECTION' ? "COD Collection" : "Cash Handover"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                  <span>{format(new Date(entry.created_at), "dd MMM · HH:mm")}</span>
                  {entry.order_id && <span>· #{entry.order_id.slice(0, 8).toUpperCase()}</span>}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-black tracking-tighter",
                entry.type === 'COLLECTION' ? "text-emerald-600" : "text-blue-600"
              )}>
                {entry.type === 'COLLECTION' ? "+" : "-"}₹{Number(entry.amount).toFixed(0)}
              </p>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                entry.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-700" : 
                entry.status === 'SUBMITTED' ? "bg-amber-100 text-amber-700 animate-pulse" : 
                "bg-slate-100 text-slate-700"
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
