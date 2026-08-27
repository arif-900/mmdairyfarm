import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderDetailsDialog } from "@/components/admin/OrderDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import {
    LogOut,
    RefreshCw,
    ScanLine,
    Store,
    Package,
    Search,
    Loader2,
    AlertCircle,
    MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatHistoryTab } from "@/components/admin/ChatHistoryTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { DeliveryBoysTab } from "@/components/admin/DeliveryBoysTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { CodLedgerTab } from "@/components/admin/CodLedgerTab";
import { MakingVideosTab } from "@/components/admin/MakingVideosTab";
import { SmartScannerModal } from "@/components/shared/SmartScannerModal";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
    assigned_to?: string | null;
    is_cash_collected?: boolean;
};
type OrderStatus = Database["public"]["Enums"]["order_status"] | 'picked_up' | 'out_for_delivery';

const StaffDashboard = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all" | "refunded">("all");
    const [assignmentFilter, setAssignmentFilter] = useState<"all" | "me">("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [unresolvedFeedbackCount, setUnresolvedFeedbackCount] = useState(0);

    const handleScanResult = (decodedText: string) => {
        const scannedValue = decodedText.trim();
        const foundOrder = orders.find((o) => {
            if (o.id === scannedValue) return true;
            // Match both new MM prefix and old FMPP prefix for robustness
            const mmAWB = `MM${o.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10).toUpperCase()}`;
            const fmppAWB = `FMPP${o.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10).toUpperCase()}`;
            if (mmAWB === scannedValue || fmppAWB === scannedValue) return true;
            return false;
        });

        if (foundOrder) {
            toast({ title: "Package Found", description: `Opened details for #${foundOrder.id.slice(0, 8).toUpperCase()}` });
            setSelectedOrder(foundOrder);
            setDialogOpen(true);
        } else {
            toast({ title: "Order Not Found", description: "This barcode or QR code does not match any active orders.", variant: "destructive" });
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            const fetchedOrders = (data || []).filter(o =>
                !(o.status === 'pending' && o.payment_method === 'online')
            );

            // Manually map Profile Customer Names
            if (fetchedOrders.length > 0) {
                const userIds = [...new Set(fetchedOrders.map((o: any) => o.user_id).filter(Boolean))];
                let profilesMap: Record<string, any> = {};

                if (userIds.length > 0) {
                    const { data: profilesData } = await (supabase as any)
                        .from("profiles")
                        .select("user_id, full_name, phone")
                        .in("user_id", userIds);

                    if (profilesData) {
                        profilesMap = profilesData.reduce((acc: any, profile: any) => {
                            acc[profile.user_id] = profile;
                            return acc;
                        }, {});
                    }
                }

                // Fetch Order Items for these orders
                const orderIds = fetchedOrders.map((o: any) => o.id);
                const { data: itemsData } = await supabase
                    .from("order_items")
                    .select("*")
                    .in("order_id", orderIds);

                const itemsMap = (itemsData || []).reduce((acc: any, item: any) => {
                    if (!acc[item.order_id]) acc[item.order_id] = [];
                    acc[item.order_id].push(item);
                    return acc;
                }, {});

                const mergedOrders = fetchedOrders.map((item: any) => ({
                    ...item,
                    profiles: item.user_id ? profilesMap[item.user_id] || null : null,
                    order_items: itemsMap[item.id] || [],
                })) as any[];
                setOrders(mergedOrders);
            } else {
                setOrders([]);
            }

            // Fetch low stock warnings
            const { data: prodData } = await supabase.from("products").select("stock");
            const lowStockVal = prodData?.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 10).length || 0;
            setLowStockCount(lowStockVal);

            // Fetch unresolved feedbacks count
            const { count: feedbackCount } = await supabase
                .from("feedbacks")
                .select("*", { count: "exact", head: true })
                .neq("status", "resolved");
            setUnresolvedFeedbackCount(feedbackCount || 0);

        } catch (err) {
            console.error("Error fetching orders:", err);
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Subscribe to realtime updates
        const channel = supabase
            .channel("staff-orders")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setOrders((prev) => [payload.new as Order, ...prev]);
                        toast({
                            title: "New Order",
                            description: `Order #${(payload.new as Order).id.slice(0, 8).toUpperCase()} received`,
                        });
                    } else if (payload.eventType === "UPDATE") {
                        setOrders((prev) =>
                            prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
                        );
                    } else if (payload.eventType === "DELETE") {
                        setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth", { replace: true });
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.phone.includes(searchTerm) ||
            order.shipping_address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "refunded" ? (order.status === "cancelled" && (order as any).refund_id) :
                statusFilter === "cancelled" ? (order.status === "cancelled" && !(order as any).refund_id) :
                    order.status === statusFilter);
        const matchesAssignment = assignmentFilter === "all" || order.assigned_to === user?.id;
        return matchesSearch && matchesStatus && matchesAssignment;
    });

    return (
        <div className="min-h-screen bg-[#061A13] text-[#F5F3EC]">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#082D20] backdrop-blur-xl sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-[#10291F] rounded-xl flex items-center justify-center border border-white/10 text-[#C98A24]">
                            <Store className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#F5F3EC] uppercase tracking-tight leading-none mb-1">
                                STAFF <span className="text-[#C98A24]">PORTAL</span>
                            </h1>
                            <p className="text-[10px] text-[#AAB8B0] font-bold tracking-[0.2em] uppercase">Operations Unit</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="outline" size="sm" onClick={() => setIsScannerOpen(true)} className="bg-[#10291F] text-[#F5F3EC] border-white/10 hover:bg-[#164431] shadow-sm flex px-4 rounded-xl h-11 transition-all group hidden sm:flex">
                            <ScanLine className="h-5 w-5 sm:mr-2 text-[#C98A24]" />
                            <span className="font-bold uppercase text-[11px] tracking-widest">Scan Pack</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate("/delivery/dashboard")} className="hidden md:flex px-4 rounded-xl h-11 border-white/10 bg-[#10291F] text-[#F5F3EC] font-bold uppercase text-[11px] tracking-widest hover:bg-[#164431]">
                            <Package className="h-4 w-4 mr-2 text-[#C98A24]" />
                            <span>Dispatch</span>
                        </Button>
                        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            className="h-11 w-11 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all text-[#AAB8B0]"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">

                {/* Main Content Tabs */}
                <Tabs defaultValue="operations" className="space-y-6">
                    <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <TabsList className="bg-[#0B2118] flex justify-start gap-1 p-1.5 h-14 rounded-2xl min-w-max border border-white/10">
                            <TabsTrigger value="operations" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Console</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Orders</TabsTrigger>
                            <TabsTrigger value="products" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Products</TabsTrigger>
                            <TabsTrigger value="delivery" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Logistics</TabsTrigger>
                            <TabsTrigger value="settlements" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Invoices</TabsTrigger>
                            <TabsTrigger value="chat" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Chat</TabsTrigger>
                            <TabsTrigger value="announcements" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Announce</TabsTrigger>
                            <TabsTrigger value="feedback" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Feedback</TabsTrigger>
                            <TabsTrigger value="offers" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Offers</TabsTrigger>
                            <TabsTrigger value="videos" className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-[#C98A24] data-[state=active]:text-[#061A13]">Story</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="operations" className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* KPI 1: Assigned Orders */}
                            <Card className="bg-white border border-forest/10 rounded-[10px] shadow-sm overflow-hidden relative group">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[10px] bg-forest/5 flex items-center justify-center border border-forest/10">
                                        <Package className="w-6 h-6 text-forest" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Assigned Orders</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {orders.filter(o => o.assigned_to === user?.id && o.status !== 'delivered' && o.status !== 'cancelled').length}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KPI 2: Low Stock Products */}
                            <Card className="bg-white border border-amber-100 rounded-[10px] shadow-sm overflow-hidden relative group">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[10px] bg-amber-50 flex items-center justify-center border border-amber-100">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Low Stock Warnings</p>
                                        <p className="text-2xl font-black text-slate-800">{lowStockCount}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KPI 3: Customer Feedback */}
                            <Card className="bg-white border border-sky-100 rounded-[10px] shadow-sm overflow-hidden relative group">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[10px] bg-sky-50 flex items-center justify-center border border-sky-100">
                                        <MessageSquare className="w-6 h-6 text-sky-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unresolved Inquiries</p>
                                        <p className="text-2xl font-black text-slate-800">{unresolvedFeedbackCount}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Checklist Task Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white border border-slate-100 shadow-sm rounded-[10px]">
                                <CardHeader className="pb-2 pt-4 px-5">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">📋 Today's Checklist</h3>
                                </CardHeader>
                                <CardContent className="space-y-4 px-5 pb-5">
                                    {/* Task Item 1 */}
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100">
                                        <input type="checkbox" className="w-4 h-4 rounded text-forest focus:ring-forest mt-0.5" defaultChecked={orders.filter(o => o.status === 'processing').length === 0} />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Pack outgoing orders</p>
                                            <p className="text-[10px] text-slate-400">
                                                {orders.filter(o => o.status === 'processing').length} orders are currently in the packaging phase.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Task Item 2 */}
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100">
                                        <input type="checkbox" className="w-4 h-4 rounded text-forest focus:ring-forest mt-0.5" defaultChecked={lowStockCount === 0} />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Verify inventory thresholds</p>
                                            <p className="text-[10px] text-slate-400">
                                                {lowStockCount} products are running low on stock. Review list to avoid service disruption.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Task Item 3 */}
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100">
                                        <input type="checkbox" className="w-4 h-4 rounded text-forest focus:ring-forest mt-0.5" defaultChecked={unresolvedFeedbackCount === 0} />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Reply to customer queries</p>
                                            <p className="text-[10px] text-slate-400">
                                                {unresolvedFeedbackCount} feedback rows require support replies.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-slate-100 shadow-sm rounded-[10px] flex flex-col justify-between">
                                <CardHeader className="pb-2 pt-4 px-5">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">⚡ Operations Shortcuts</h3>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3 flex-1 pb-5 px-5">
                                    <button onClick={() => setIsScannerOpen(true)} className="flex flex-col items-center justify-center p-4 bg-forest/5 hover:bg-forest/10 border border-forest/10 rounded-[10px] transition-all text-center gap-2 group">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-forest">Open Barcode Scanner</span>
                                    </button>

                                    <button onClick={() => {
                                        const trigger = document.querySelector('[value="products"]');
                                        if (trigger) (trigger as HTMLButtonElement).click();
                                    }} className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-[10px] transition-all text-center gap-2 group">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">Manage Catalog</span>
                                    </button>

                                    <button onClick={() => {
                                        const trigger = document.querySelector('[value="delivery"]');
                                        if (trigger) (trigger as HTMLButtonElement).click();
                                    }} className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-[10px] transition-all text-center gap-2 group">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">🚚</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700">Riders Directory</span>
                                    </button>

                                    <button onClick={() => {
                                        const trigger = document.querySelector('[value="settlements"]');
                                        if (trigger) (trigger as HTMLButtonElement).click();
                                    }} className="flex flex-col items-center justify-center p-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-[10px] transition-all text-center gap-2 group">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-700">COD Ledger</span>
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-forest transition-colors" />
                                <Input
                                    placeholder="Search ID, Phone, Address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-white/50 border-forest/10 focus:border-forest/30 focus:ring-forest/5 rounded-[10px] h-12 font-bold transition-all"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => setStatusFilter(val as any)}
                            >
                                <SelectTrigger className="w-[180px] h-12 rounded-[10px] bg-white/50 border-forest/10 font-black text-[11px] uppercase tracking-widest transition-all">
                                    <SelectValue placeholder="Status Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled (No Refund)</SelectItem>
                                    <SelectItem value="refunded">Refunded Orders</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={assignmentFilter}
                                onValueChange={(val) => setAssignmentFilter(val as "all" | "me")}
                            >
                                <SelectTrigger className="w-[150px] h-12 rounded-[10px] bg-white/50 border-forest/10 font-black text-[11px] uppercase tracking-widest transition-all">
                                    <SelectValue placeholder="Assignment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Orders</SelectItem>
                                    <SelectItem value="me">Assigned to Me</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>

                        <div className="border rounded-[10px] overflow-x-auto bg-card scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            <div className="min-w-[800px]">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No orders found</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Products</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOrders.map((order) => (
                                                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                                                    <TableCell className="font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                                                    <TableCell className="text-muted-foreground">{format(new Date(order.created_at), "dd MMM, p")}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{(order as any).user_name || (order as any).profiles?.full_name || "Unknown Customer"}</p>
                                                            <p className="font-medium text-sm text-gray-600">{order.phone}</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{order.shipping_address}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                            {(order as any).order_items?.map((item: any) => (
                                                                <span key={item.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-forest/5 text-forest text-[10px] font-black rounded-[10px] border border-forest/10 uppercase tracking-tighter">
                                                                    {item.product_name} <span className="opacity-60 text-[9px] font-black">×{item.quantity}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">₹{Number(order.total_amount).toFixed(0)}</TableCell>
                                                    <TableCell><OrderStatusBadge status={order.status} refundId={(order as any).refund_id} /></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}>
                                                            Manage Order
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="products"><ProductsTab /></TabsContent>
                    <TabsContent value="delivery"><DeliveryBoysTab /></TabsContent>
                    <TabsContent value="settlements"><CodLedgerTab /></TabsContent>
                    <TabsContent value="chat"><ChatHistoryTab /></TabsContent>
                    <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
                    <TabsContent value="feedback"><FeedbackTab /></TabsContent>
                    <TabsContent value="offers"><OffersTab /></TabsContent>
                    <TabsContent value="videos"><MakingVideosTab /></TabsContent>
                </Tabs>
            </main>

            <OrderDetailsDialog
                order={selectedOrder}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onStatusUpdate={() => {
                    fetchOrders();
                    setDialogOpen(false);
                }}
            />
            <SmartScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
            />
        </div>
    );
};

export default StaffDashboard;
