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
    CreditCard,
    Filter,
    IndianRupee,
    Calendar as CalendarIcon,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
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

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
    assigned_to?: string | null;
    is_cash_collected?: boolean;
    delivery_otp?: string | null;
};

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    price_at_order: number;
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

const PaymentBadge = ({ method }: { method: string }) => {
    if (method === "cod") {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                <span>💵 Cash on Delivery</span>
            </div>
        );
    }
    if (method === "online") {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
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
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
    const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", user.id)
            .maybeSingle();
        if (data) setProfile(data);
    };

    const fetchMyOrders = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .or(`assigned_to.eq.${user.id},and(status.eq.processing,assigned_to.is.null)`)
                .order("created_at", { ascending: false });

            if (error) throw error;
            const ordersData = data || [];
            setOrders(ordersData);

            // Fetch items for all orders
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
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const updateStatus = async (orderId: string, status: string, providedOtp?: string) => {
        const order = orders.find(o => o.id === orderId);
        if (status === 'delivered' && order && order.delivery_otp) {
            const entered = providedOtp?.trim() || "";
            const stored = order.delivery_otp?.trim() || "";
            
            if (entered !== stored) {
                toast({ 
                    title: "Invalid Code", 
                    description: "The verification code is incorrect. Please ask the customer for the correct code.", 
                    variant: "destructive" 
                });
                return;
            }
        }

        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: status as any })
                .eq("id", orderId);
            if (error) throw error;
            toast({ title: "✓ Status Updated", description: `Order marked as "${status.replace(/_/g, " ")}"` });
            fetchMyOrders();
        } catch {
            toast({ title: "Failed", description: "Could not update status", variant: "destructive" });
        }
    };

    const handleClaim = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ assigned_to: user?.id, status: 'picked_up' } as any)
                .eq("id", orderId);
            if (error) throw error;
            toast({ title: "✓ Order Accepted", description: "This order is now assigned to you" });
            fetchMyOrders();
        } catch {
            toast({ title: "Failed", description: "Could not accept order", variant: "destructive" });
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

    const handleSignOut = async () => {
        await signOut();
        navigate("/delivery/login");
    };

    const openInMaps = (address: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrders(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
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

    const codPendingCount = filteredOrders.filter(o => 
        o.assigned_to === user?.id &&
        o.payment_method === 'cod' && 
        !o.is_cash_collected && 
        o.status !== 'cancelled'
    ).length;

    const codCollectedFiltered = filteredOrders
        .filter(o => 
            o.assigned_to === user?.id && 
            o.payment_method === 'cod' && 
            o.is_cash_collected === true
        )
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 relative overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Premium Header */}
            <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-3xl border-b border-slate-200/50 px-4 py-7 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-primary/5">
                                <Bike className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                    {profile?.full_name || 'Delivery Partner'}
                                </h1>
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
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSignOut} 
                            className="rounded-2xl w-11 h-11 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Dynamic Metrics Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group overflow-hidden bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-slate-900/20 transition-all active:scale-95 duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            
                            <div className="relative z-10 space-y-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Delivered Today</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black tracking-tighter tabular-nums">{deliveredTodayCount}</p>
                                        <span className="text-xs font-bold text-emerald-400">Total</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative group overflow-hidden bg-white rounded-[32px] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 transition-all active:scale-95 duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            
                            <div className="relative z-10 space-y-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Tasks</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{myPendingCount}</p>
                                        <span className="text-xs font-bold text-primary">To Do</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cash Collection Summary Card */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-[32px] p-6 text-white shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] duration-500">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em]">Total Cash Collected (Filtered)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-bold text-emerald-200">₹</span>
                                    <p className="text-4xl font-black tracking-tighter tabular-nums">{codCollectedFiltered.toFixed(0)}</p>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                                <IndianRupee className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Search & Refresh */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Order ID / Address..."
                                    className="w-full h-12 bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all" 
                                onClick={fetchMyOrders} 
                                disabled={loading}
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''} text-primary`} />
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger className="h-10 rounded-xl text-[11px] font-black border-slate-200/80 bg-white min-w-[120px] uppercase tracking-wider shadow-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                                    <SelectItem value="all">All Deliveries</SelectItem>
                                    <SelectItem value="processing">🔵 Preparing</SelectItem>
                                    <SelectItem value="picked_up">🟣 Picked Up</SelectItem>
                                    <SelectItem value="out_for_delivery">🟠 On the Way</SelectItem>
                                    <SelectItem value="delivered">🟢 Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
                                <SelectTrigger className="h-10 rounded-xl text-[11px] font-black border-slate-200/80 bg-white min-w-[120px] uppercase tracking-wider shadow-sm">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                                    <SelectItem value="all">Any Payment</SelectItem>
                                    <SelectItem value="cod">💵 Cash (COD)</SelectItem>
                                    <SelectItem value="online">✅ Prepaid</SelectItem>
                                </SelectContent>
                            </Select>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 rounded-xl text-[11px] font-black border-slate-200/80 bg-white min-w-[140px] uppercase tracking-wider shadow-sm justify-start",
                                            !selectedDate && "text-slate-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl border-slate-200 shadow-2xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                        className="rounded-3xl"
                                    />
                                    {selectedDate && (
                                        <div className="p-3 border-t border-slate-100 flex justify-center">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                                                onClick={() => setSelectedDate(undefined)}
                                            >
                                                Clear Date
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                            <p className="text-xl font-black text-slate-900">{filteredOrders.filter(o => !o.assigned_to).length}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                    <div className={`rounded-3xl p-4 border shadow-sm flex items-center justify-between transition-all ${codPendingCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200/60'}`}>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash Due</p>
                            <p className={`text-xl font-black ${codPendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{codPendingCount}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${codPendingCount > 0 ? 'bg-amber-200 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                            <CreditCard className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                            <p className="text-slate-400 font-bold mt-4 text-sm">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <h3 className="text-slate-700 font-black text-lg">
                                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' ? 'No matching orders' : 'All Caught Up!'}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' ? 'Try adjusting filters.' : 'No orders available for delivery right now.'}
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order, index) => {
                            const items = orderItems[order.id] || [];
                            const isUnassigned = !order.assigned_to;
                            const isCOD = order.payment_method === 'cod';

                            return (
                                <div 
                                    key={order.id} 
                                    className={`animate-in fade-in slide-in-from-bottom-6 duration-700 delay-[${index * 100}ms] fill-mode-both`}
                                >
                                    <Card className={`overflow-hidden border-none shadow-xl rounded-[32px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] ${isUnassigned ? 'bg-slate-950 text-white ring-1 ring-white/10' : 'bg-white/70 backdrop-blur-md border border-white/20'}`}>
                                        <CardContent className="p-6 space-y-5">
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isUnassigned ? 'bg-emerald-400' : 'bg-primary'}`} />
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isUnassigned ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            Order Unit {order.id.slice(0, 6).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className={`h-3.5 w-3.5 ${isUnassigned ? 'text-slate-400' : 'text-slate-400'}`} />
                                                        <span className={`text-xs font-black tracking-tight ${isUnassigned ? 'text-slate-200' : 'text-slate-900'}`}>
                                                            {format(new Date(order.created_at), "h:mm a · dd MMM")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={order.status} />
                                            </div>

                                            {/* Order Details Crystal Module */}
                                            <div className={`rounded-[24px] p-5 space-y-4 ${isUnassigned ? 'bg-white/5 border border-white/10 shadow-inner' : 'bg-slate-50/50 border border-slate-100'}`}>
                                                {/* Payment & Amount Row */}
                                                <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200/10">
                                                    <PaymentBadge method={order.payment_method || ''} />
                                                    <div className="flex items-center gap-1">
                                                        <IndianRupee className={`h-4 w-4 font-black ${isUnassigned ? 'text-emerald-400' : 'text-primary'}`} />
                                                        <span className={`text-2xl font-black tracking-tighter tabular-nums ${isUnassigned ? 'text-white' : 'text-slate-900'}`}>
                                                            {Number(order.total_amount).toFixed(0)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Items Section */}
                                                {items.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <ShoppingBag className={`h-4 w-4 ${isUnassigned ? 'text-slate-500' : 'text-slate-400'}`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isUnassigned ? 'text-slate-500' : 'text-slate-400'}`}>Parcel Contents</span>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            {items.map(item => (
                                                                <div key={item.id} className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                                                                    <span className={`text-sm font-bold truncate pr-4 ${isUnassigned ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                        {item.product_name}
                                                                    </span>
                                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${isUnassigned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                                                                        × {item.quantity}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Client & Navigation Section */}
                                            <div className="space-y-4 px-1">
                                                {/* Address Block */}
                                                <div className="flex gap-4 group/address">
                                                    <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 border transition-transform group-hover/address:scale-110 duration-500 ${isUnassigned ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                                                        <MapPin className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isUnassigned ? 'text-slate-500' : 'text-slate-400'}`}>Destination</p>
                                                        <p className={`text-sm font-black leading-tight ${isUnassigned ? 'text-white' : 'text-slate-900'}`}>
                                                            {order.shipping_address}
                                                        </p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openInMaps(order.shipping_address); }}
                                                            className={`text-[10px] font-black tracking-[0.1em] uppercase flex items-center gap-1.5 mt-2 transition-all hover:gap-2 ${isUnassigned ? 'text-emerald-400' : 'text-primary'}`}
                                                        >
                                                            <Navigation className="h-3 w-3" />
                                                            Navigate Drive
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Phone Block */}
                                                <div className="flex gap-4 items-center group/phone">
                                                    <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 border transition-transform group-hover/phone:scale-110 duration-500 ${isUnassigned ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        <Phone className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isUnassigned ? 'text-slate-500' : 'text-slate-400'}`}>Customer Contact</p>
                                                        <a href={`tel:${order.phone}`} className={`text-base font-black tracking-tight hover:underline transition-all ${isUnassigned ? 'text-white' : 'text-slate-900'}`}>
                                                            {order.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* COD Management Panel */}
                                            {isCOD && order.assigned_to && order.status !== 'cancelled' && (
                                                <div className={`p-4 rounded-[24px] border-2 transition-all duration-500 ${order.is_cash_collected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100 shadow-[0_4px_12px_rgba(245,158,11,0.08)]'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${order.is_cash_collected ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {order.is_cash_collected ? 'Transaction Verified' : 'Outstanding Payment'}
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-xl font-black ${order.is_cash_collected ? 'text-emerald-900' : 'text-amber-900'}`}>
                                                                    ₹{Number(order.total_amount).toFixed(0)}
                                                                </span>
                                                                {!order.is_cash_collected && (
                                                                    <div className="flex space-x-0.5 ml-1">
                                                                        {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className={`rounded-2xl font-black text-[10px] tracking-widest h-10 px-6 uppercase transition-all active:scale-90 ${order.is_cash_collected ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200'}`}
                                                            onClick={() => handleToggleCash(order.id, !!order.is_cash_collected)}
                                                        >
                                                            {order.is_cash_collected ? 'Rollback' : 'Confirm Cash'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Transition Actions */}
                                            <div className="pt-2">
                                                {isUnassigned ? (
                                                    <Button
                                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-14 rounded-[24px] font-black text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/40 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                                                        onClick={() => handleClaim(order.id)}
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 mr-3" />
                                                        ACCEPT DELIVERY TASK
                                                    </Button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {['pending', 'paid'].includes(order.status as any) && (
                                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-[24px] text-white font-black text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                                                                onClick={() => updateStatus(order.id, 'processing')}>
                                                                <Package className="h-5 w-5 mr-3" />
                                                                INITIALIZE PREPARATION
                                                            </Button>
                                                        )}
                                                        {(order.status as any) === 'processing' && (
                                                            <Button className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-[24px] text-white font-black text-xs tracking-[0.2em] shadow-xl shadow-slate-900/20 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 transition-all"
                                                                onClick={() => updateStatus(order.id, 'picked_up')}>
                                                                <Truck className="h-5 w-5 mr-3" />
                                                                CONFIRM PICKUP
                                                            </Button>
                                                        )}
                                                        {(order.status as any) === 'picked_up' && (
                                                            <Button className="w-full bg-primary hover:bg-primary/90 h-14 rounded-[24px] text-white font-black text-xs tracking-[0.2em] shadow-xl shadow-primary/30 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all"
                                                                onClick={() => updateStatus(order.id, 'out_for_delivery')}>
                                                                <Navigation className="h-5 w-5 mr-3" />
                                                                LAUNCH DELIVERY
                                                            </Button>
                                                        )}
                                                        {(order.status as any) === 'out_for_delivery' && (
                                                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                                                <div className="bg-slate-50/80 rounded-[28px] p-5 border-2 border-primary/10 shadow-inner space-y-3 text-center">
                                                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">Customer Verification Code</Label>
                                                                    <div className="flex gap-3 justify-center">
                                                                        <Input 
                                                                            placeholder="······" 
                                                                            className="h-16 w-[220px] rounded-2xl border-none bg-white shadow-xl text-center text-3xl font-black tracking-[0.4em] placeholder:text-slate-200 focus:ring-4 focus:ring-primary/10 transition-all"
                                                                            maxLength={6}
                                                                            value={otpInputs[order.id] || ''}
                                                                            onChange={(e) => setOtpInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                                        />
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            className="h-16 w-16 rounded-2xl border border-slate-200 bg-white shadow-lg active:scale-90 transition-all"
                                                                            onClick={() => handleRegenerateOtp(order.id)}
                                                                        >
                                                                            <RefreshCw className="h-5 w-5 text-primary" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Button 
                                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[28px] text-white font-black text-sm tracking-[0.2em] shadow-2xl shadow-emerald-600/30 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
                                                                    onClick={() => updateStatus(order.id, 'delivered', otpInputs[order.id])}
                                                                >
                                                                    VERIFY & COMPLETE DELIVERY
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {(order.status as any) === 'delivered' && (
                                                            <div className="bg-emerald-50 rounded-3xl py-4 border border-emerald-100 border-dashed animate-in zoom-in duration-500">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                                                    <p className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Job Successfully Handed Over</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
