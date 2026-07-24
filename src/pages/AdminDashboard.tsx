import { useState, useEffect, lazy, Suspense } from "react";
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
  ShoppingCart,
  TrendingUp,
  Loader2,
  ScanLine,
  CalendarHeart,
  Truck,
  BarChart4,
  LayoutDashboard,
  Users,
  UserCog,
  Receipt,
  MessageSquare,
  Tag,
  DollarSign,
  MessageCircle,
  Video,
  Megaphone,
  Star,
  Menu,
  X,
  Store,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
const ChatHistoryTab = lazy(() => import("@/components/admin/ChatHistoryTab").then(m => ({ default: m.ChatHistoryTab })));
const AnnouncementsTab = lazy(() => import("@/components/admin/AnnouncementsTab").then(m => ({ default: m.AnnouncementsTab })));
const FeedbackTab = lazy(() => import("@/components/admin/FeedbackTab").then(m => ({ default: m.FeedbackTab })));
const OverviewTab = lazy(() => import("@/components/admin/OverviewTab").then(m => ({ default: m.OverviewTab })));
const StaffTab = lazy(() => import("@/components/admin/StaffTab").then(m => ({ default: m.StaffTab })));
const ProductsTab = lazy(() => import("@/components/admin/ProductsTab").then(m => ({ default: m.ProductsTab })));
const OffersTab = lazy(() => import("@/components/admin/OffersTab").then(m => ({ default: m.OffersTab })));
const CommissionsTab = lazy(() => import("@/components/admin/CommissionsTab").then(m => ({ default: m.CommissionsTab })));
const DeliveryBoysTab = lazy(() => import("@/components/admin/DeliveryBoysTab").then(m => ({ default: m.DeliveryBoysTab })));
const WhatsAppTab = lazy(() => import("@/components/admin/WhatsAppTab").then(m => ({ default: m.WhatsAppTab })));
const MakingVideosTab = lazy(() => import("@/components/admin/MakingVideosTab").then(m => ({ default: m.MakingVideosTab })));
const CodLedgerTab = lazy(() => import("@/components/admin/CodLedgerTab").then(m => ({ default: m.CodLedgerTab })));
const SmartScannerModal = lazy(() => import("@/components/shared/SmartScannerModal").then(m => ({ default: m.SmartScannerModal })));
const SubscriptionsTab = lazy(() => import("@/components/admin/SubscriptionsTab").then(m => ({ default: m.SubscriptionsTab })));
const DeliveryTrackingTab = lazy(() => import("@/components/admin/DeliveryTrackingTab").then(m => ({ default: m.DeliveryTrackingTab })));
const AnalyticsTab = lazy(() => import("@/components/admin/AnalyticsTab").then(m => ({ default: m.AnalyticsTab })));
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface NavItem {
  value: string;
  label: string;
  icon: React.ElementType;
  show: boolean;
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(isAdmin ? "overview" : "orders");
  }, [isAdmin]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const categories = [
    {
      label: "Dashboard",
      items: [
        { value: "overview", label: "Overview", icon: LayoutDashboard, show: isAdmin },
        { value: "analytics", label: "Growth/Analytics", icon: BarChart4, show: true },
      ]
    },
    {
      label: "Commerce",
      items: [
        { value: "orders", label: "Orders", icon: ShoppingCart, show: true },
        { value: "products", label: "Products", icon: Package, show: true },
        { value: "offers", label: "Offers", icon: Tag, show: true },
        { value: "subscriptions", label: "Subscriptions", icon: CalendarHeart, show: true },
      ]
    },
    {
      label: "Delivery",
      items: [
        { value: "delivery", label: "Delivery Boys", icon: UserCog, show: isAdmin },
        { value: "tracking", label: "Tracking", icon: Truck, show: true },
      ]
    },
    {
      label: "Finance",
      items: [
        { value: "settlements", label: "COD Ledger", icon: Receipt, show: isAdmin },
        { value: "commissions", label: "Commissions", icon: DollarSign, show: true },
      ]
    },
    {
      label: "People",
      items: [
        { value: "staff", label: "Staff", icon: Users, show: isSuperAdmin },
      ]
    },
    {
      label: "Marketing",
      items: [
        { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, show: true },
        { value: "announcements", label: "Announcements", icon: Megaphone, show: true },
        { value: "videos", label: "Story/Videos", icon: Video, show: true },
      ]
    },
    {
      label: "Support",
      items: [
        { value: "feedback", label: "Feedback", icon: Star, show: true },
        { value: "chat", label: "AI Chats", icon: MessageSquare, show: true },
      ]
    }
  ];

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
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev]);
          toast({ title: "New Order!", description: `Order #${(payload.new as Order).id.slice(0, 8).toUpperCase()} received` });
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o)));
        } else if (payload.eventType === "DELETE") {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    revenue: orders.filter((o) => o.status !== "cancelled" && o.status !== "pending").reduce((sum, o) => sum + Number(o.total_amount), 0),
    monthlyRev: orders
      .filter((o) => o.status !== "cancelled" && o.status !== "pending")
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return isAdmin ? <OverviewTab onTabChange={setActiveTab} /> : null;
      case "subscriptions": return <SubscriptionsTab />;
      case "tracking": return <DeliveryTrackingTab />;
      case "analytics": return <AnalyticsTab />;
      case "staff": return isSuperAdmin ? <StaffTab /> : null;
      case "settlements": return isAdmin ? <CodLedgerTab /> : null;
      case "delivery": return isAdmin ? <DeliveryBoysTab /> : null;
      case "products": return <ProductsTab />;
      case "chat": return <ChatHistoryTab />;
      case "offers": return <OffersTab />;
      case "commissions": return <CommissionsTab />;
      case "whatsapp": return <WhatsAppTab />;
      case "videos": return <MakingVideosTab />;
      case "announcements": return <AnnouncementsTab />;
      case "feedback": return <FeedbackTab />;
      case "orders": return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-forest transition-colors" />
              <Input
                placeholder="ID, Phone, Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/50 border-forest/10 focus:border-forest/30 focus:ring-forest/5 rounded-[10px] h-12 font-bold transition-all"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
              <SelectTrigger className="w-[180px] h-12 rounded-[10px] bg-white/50 border-forest/10 font-black text-[11px] uppercase tracking-widest">
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
            <Button variant="outline" onClick={fetchOrders} className="h-12 rounded-[10px] border-forest/10">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          <div className="border rounded-[10px] overflow-hidden bg-card shadow-soft">
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
                      <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest hover:bg-forest/5"
                        onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}>Manage</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-full w-64 bg-card border-r border-forest/10 flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-forest/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-forest rounded-[10px] flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-forest text-sm leading-tight">Admin</h2>
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">MMVALI Dairy</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-[10px] hover:bg-forest/5 flex items-center justify-center text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {categories.map((category) => {
            const visibleItems = category.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;
            return (
              <div key={category.label} className="space-y-1">
                <p className="px-3 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">
                  {category.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          setActiveTab(item.value);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[11px] font-bold uppercase tracking-wider transition-all",
                          activeTab === item.value
                            ? "bg-forest text-white shadow-md shadow-forest/15"
                            : "text-muted-foreground hover:bg-forest/5 hover:text-forest"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 flex-shrink-0",
                            activeTab === item.value ? "text-white" : "text-muted-foreground group-hover:text-forest"
                          )}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-forest/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top Header */}
        <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-[10px] bg-forest/5 flex items-center justify-center text-forest hover:bg-forest/10"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-4">
                <div className="w-10 h-10 bg-forest/5 rounded-[10px] flex items-center justify-center border border-forest/10">
                  <Store className="h-6 w-6 text-forest" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-forest uppercase tracking-tight leading-none mb-0.5">Admin Portal</h1>
                  <p className="text-[9px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">MMVALI Dairy Farm</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="bg-forest/5 text-forest border-forest/10 hover:bg-forest/10 shadow-sm flex px-4 rounded-[10px] h-10 transition-all group"
              >
                <ScanLine className="h-4 w-4 sm:mr-2 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline font-black uppercase text-[10px] tracking-widest">Scan Pack</span>
              </Button>
              <div className="h-6 w-px bg-forest/10 mx-1 hidden sm:block" />
              <button
                onClick={handleSignOut}
                className="h-10 w-10 rounded-[10px] hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 flex items-center justify-center text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-600 rounded-[10px] p-4 text-white shadow-lg flex flex-col justify-between">
              <ShoppingCart className="h-4 w-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">Total Orders</p>
                <p className="text-xl font-black">{stats.total}</p>
              </div>
            </div>
            <div className="bg-amber-500 rounded-[10px] p-4 text-white shadow-lg flex flex-col justify-between">
              <Loader2 className="h-4 w-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">Pending</p>
                <p className="text-xl font-black">{stats.pending}</p>
              </div>
            </div>
            <div className="bg-emerald-500 rounded-[10px] p-4 text-white shadow-lg flex flex-col justify-between">
              <TrendingUp className="h-4 w-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">Success</p>
                <p className="text-xl font-black">{stats.delivered}</p>
              </div>
            </div>
            <div className="bg-violet-600 rounded-[10px] p-4 text-white shadow-lg flex flex-col justify-between">
              <span className="text-base font-black opacity-70">₹</span>
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">Revenue</p>
                <p className="text-xl font-black">₹{stats.revenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-sky-500 rounded-[10px] p-4 text-white shadow-lg flex flex-col justify-between hidden md:flex">
              <BarChart4 className="h-4 w-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">This Month</p>
                <p className="text-xl font-black">₹{(stats.monthlyRev / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            <Suspense fallback={
              <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-forest" />
                <span>Loading tab content...</span>
              </div>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

      <OrderDetailsDialog order={selectedOrder} open={dialogOpen} onOpenChange={setDialogOpen} onStatusUpdate={fetchOrders} />
      {isScannerOpen && (
        <Suspense fallback={null}>
          <SmartScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScanResult} />
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
