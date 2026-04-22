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
  Search,
  Package,
  Store,
  ShoppingCart,
  TrendingUp,
  Loader2,
  ScanLine,
  CalendarHeart,
  Truck,
  BarChart4,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatHistoryTab } from "@/components/admin/ChatHistoryTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { StaffTab } from "@/components/admin/StaffTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { CommissionsTab } from "@/components/admin/CommissionsTab";
import { DeliveryBoysTab } from "@/components/admin/DeliveryBoysTab";
import { WhatsAppTab } from "@/components/admin/WhatsAppTab";
import { MakingVideosTab } from "@/components/admin/MakingVideosTab";
import { CodLedgerTab } from "@/components/admin/CodLedgerTab";
import { SmartScannerModal } from "@/components/shared/SmartScannerModal";
import { SubscriptionsTab } from "@/components/admin/SubscriptionsTab";
import { DeliveryTrackingTab } from "@/components/admin/DeliveryTrackingTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { useTranslation } from "react-i18next";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all" | "refunded">("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { signOut, role, user } = useAuth();
  const isAdmin = role === 'admin' || role === 'staff';
  const isSuperAdmin = role === 'admin';
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Default the active tab depending on role
  useEffect(() => {
    setActiveTab(isAdmin ? "overview" : "orders");
  }, [isAdmin]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

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

        const mergedOrders = fetchedOrders.map((item: any) => ({
          ...item,
          profiles: item.user_id ? profilesMap[item.user_id] || null : null,
        })) as Order[];
        setOrders(mergedOrders);
      } else {
        setOrders([]);
      }
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
      .channel("admin-orders")
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
              title: "New Order!",
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
      (statusFilter === "refunded" ? (order.status === "cancelled" && order.refund_id) : 
       statusFilter === "cancelled" ? (order.status === "cancelled" && !order.refund_id) :
       order.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleScanResult = (decodedText: string) => {
    const scannedValue = decodedText.trim();
    const foundOrder = orders.find((o) => {
        if (o.id === scannedValue) return true;
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
      toast({ title: "Order Not Found", variant: "destructive" });
    }
  };

  const currentDate = new Date();
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders
      .filter((o) => o.status !== "cancelled" && o.status !== "pending")
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
    monthlyRev: orders
      .filter((o) => o.status !== "cancelled" && o.status !== "pending")
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Premium Header - Reusing from user request */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-forest/5 rounded-2xl flex items-center justify-center border border-forest/10 transition-transform group-hover:scale-110">
              <Store className="h-7 w-7 text-forest" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-forest uppercase tracking-tighter leading-none mb-1">Admin Portal</h1>
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">MMVALI Dairy Farm</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => setIsScannerOpen(true)} className="bg-forest/5 text-forest border-forest/10 hover:bg-forest/10 shadow-sm flex px-4 rounded-xl h-11 transition-all group">
              <ScanLine className="h-5 w-5 sm:mr-2 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-black uppercase text-[11px] tracking-widest">Scan Pack</span>
            </Button>
            <div className="h-8 w-px bg-forest/10 mx-1 hidden sm:block" />
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg flex flex-col justify-between">
            <ShoppingCart className="h-4 w-4 opacity-70" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-70">Total Orders</p>
              <p className="text-xl font-black">{stats.total}</p>
            </div>
          </div>
          <div className="bg-amber-500 rounded-xl p-4 text-white shadow-lg flex flex-col justify-between">
            <Loader2 className="h-4 w-4 opacity-70" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-70">Pending</p>
              <p className="text-xl font-black">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-emerald-500 rounded-xl p-4 text-white shadow-lg flex flex-col justify-between">
            <TrendingUp className="h-4 w-4 opacity-70" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-70">Success</p>
              <p className="text-xl font-black">{stats.delivered}</p>
            </div>
          </div>
          <div className="bg-violet-600 rounded-xl p-4 text-white shadow-lg flex flex-col justify-between">
            <span className="text-base font-black opacity-70">₹</span>
            <div>
              <p className="text-[10px] font-black uppercase opacity-70">Revenue</p>
              <p className="text-xl font-black">₹{stats.revenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-sky-500 rounded-xl p-4 text-white shadow-lg flex flex-col justify-between hidden md:flex">
             <BarChart4 className="h-4 w-4 opacity-70" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-70">This Month</p>
              <p className="text-xl font-black">₹{(stats.monthlyRev / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-cream-dark/30 backdrop-blur-sm flex justify-start gap-1 p-1.5 h-14 rounded-2xl min-w-max border border-forest/5 shadow-soft">
              {isAdmin && <TabsTrigger value="overview" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Overview</TabsTrigger>}
              {/* New V3.1 Tabs Integration */}
              <TabsTrigger value="subscriptions" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Subscriptions</TabsTrigger>
              <TabsTrigger value="tracking" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Tracking</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Growth</TabsTrigger>
              
              <TabsTrigger value="orders" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Orders</TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Products</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="staff" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Staff</TabsTrigger>}
              {isAdmin && <TabsTrigger value="delivery" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Logistics</TabsTrigger>}
              {isAdmin && <TabsTrigger value="settlements" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Invoices</TabsTrigger>}
              <TabsTrigger value="chat" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Chat</TabsTrigger>
              <TabsTrigger value="offers" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Offers</TabsTrigger>
              <TabsTrigger value="commissions" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Earnings</TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">WhatsApp</TabsTrigger>
              <TabsTrigger value="videos" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Story</TabsTrigger>
              <TabsTrigger value="announcements" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Announce</TabsTrigger>
              <TabsTrigger value="feedback" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white shadow-md">Feedback</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview"> {isAdmin && <OverviewTab />} </TabsContent>
          <TabsContent value="subscriptions"> <SubscriptionsTab /> </TabsContent>
          <TabsContent value="tracking"> <DeliveryTrackingTab /> </TabsContent>
          <TabsContent value="analytics"> <AnalyticsTab /> </TabsContent>
          <TabsContent value="staff"> {isSuperAdmin && <StaffTab />} </TabsContent>
          <TabsContent value="settlements"> {isAdmin && <CodLedgerTab />} </TabsContent>
          <TabsContent value="delivery"> {isAdmin && <DeliveryBoysTab />} </TabsContent>
          <TabsContent value="products"> <ProductsTab /> </TabsContent>
          
          <TabsContent value="orders" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-forest transition-colors" />
                <Input
                  placeholder="ID, Phone, Address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/50 border-forest/10 focus:border-forest/30 focus:ring-forest/5 rounded-xl h-12 font-bold transition-all"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-[180px] h-12 rounded-xl bg-white/50 border-forest/10 font-black text-[11px] uppercase tracking-widest">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchOrders} className="h-12 rounded-xl border-forest/10"><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
            </div>

            <div className="border rounded-2xl overflow-hidden bg-card shadow-soft">
              <Table>
                <TableHeader className="bg-forest/[0.02]">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest px-6">Order ID</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Date</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.slice(0, 50).map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-forest/[0.01] transition-colors">
                      <TableCell className="font-mono text-[10px] font-bold text-muted-foreground px-6">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{format(new Date(order.created_at), "dd MMM, p")}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-black text-sm text-forest uppercase tracking-tight">{order.profiles?.full_name || "Guest"}</p>
                          <p className="text-[10px] font-bold text-muted-foreground leading-none">{order.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-forest">₹{Number(order.total_amount).toFixed(0)}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} refundId={(order as any).refund_id} /></TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest hover:bg-forest/5" onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}>Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="chat"> <ChatHistoryTab /> </TabsContent>
          <TabsContent value="offers"> <OffersTab /> </TabsContent>
          <TabsContent value="commissions"> <CommissionsTab /> </TabsContent>
          <TabsContent value="whatsapp"> <WhatsAppTab /> </TabsContent>
          <TabsContent value="videos"> <MakingVideosTab /> </TabsContent>
          <TabsContent value="announcements"> <AnnouncementsTab /> </TabsContent>
          <TabsContent value="feedback"> <FeedbackTab /> </TabsContent>
        </Tabs>
      </main>

      <OrderDetailsDialog order={selectedOrder} open={dialogOpen} onOpenChange={setDialogOpen} onStatusUpdate={fetchOrders} />
      <SmartScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScanResult} />
    </div>
  );
};

export default AdminDashboard;
