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
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Megaphone,
  MessageSquare,
  ScanLine,
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
  const { signOut, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'staff';
  const isSuperAdmin = role === 'admin';
  const [activeTab, setActiveTab] = useState<string>("orders");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Default the active tab depending on role
  useEffect(() => {
    setActiveTab(isAdmin ? "overview" : "orders");
  }, [isAdmin]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { t, i18n } = useTranslation();

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
          console.log("Order update:", payload);
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
            // Show toast for status updates
            const updatedOrder = payload.new as Order;
            const oldOrder = payload.old as Order;
            if (updatedOrder.status !== oldOrder.status) {
              toast({
                title: "Order Status Updated",
                description: `Order #${updatedOrder.id.slice(0, 8).toUpperCase()} is now ${updatedOrder.status}`,
              });
            }
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

  // Stats
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
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-20 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-forest/5 rounded-2xl flex items-center justify-center border border-forest/10 transition-transform group-hover:scale-110">
              <Store className="h-7 w-7 text-forest" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-forest uppercase tracking-tighter leading-none mb-1">Admin Control</h1>
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">MMVALI Dairy Farm</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => setIsScannerOpen(true)} className="bg-forest/5 text-forest border-forest/10 hover:bg-forest/10 shadow-sm flex px-4 rounded-xl h-11 transition-all group">
              <ScanLine className="h-5 w-5 sm:mr-2 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-black uppercase text-[11px] tracking-widest">Scan Pack</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/delivery/dashboard")} className="hidden md:flex px-4 rounded-xl h-11 border-forest/10 font-black uppercase text-[11px] tracking-widest transition-all">
              <Package className="h-4 w-4 mr-2" />
              <span>Logistics</span>
            </Button>
            <div className="h-8 w-px bg-forest/10 mx-1 hidden sm:block" />
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 shadow-none hover:shadow-soft"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Total Orders */}
          <div className="bg-[#3B82F6] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <ShoppingCart className="h-5 w-5 opacity-80" />
            <div>
              <p className="text-xs font-medium opacity-90">Total Orders</p>
              <p className="text-2xl font-bold leading-tight">{stats.total}</p>
            </div>
          </div>
          {/* Pending */}
          <div className="bg-[#F59E0B] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <div className="h-5 w-5 opacity-80 flex items-center justify-center font-bold text-lg">🕒</div>
            <div>
              <p className="text-xs font-medium opacity-90">Pending</p>
              <p className="text-2xl font-bold leading-tight">{stats.pending}</p>
            </div>
          </div>
          {/* Delivered */}
          <div className="bg-[#10B981] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <TrendingUp className="h-5 w-5 opacity-80" />
            <div>
              <p className="text-xs font-medium opacity-90">Delivered</p>
              <p className="text-2xl font-bold leading-tight">{stats.delivered}</p>
            </div>
          </div>
          {/* Revenue */}
          <div className="bg-[#8B5CF6] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <TrendingUp className="h-5 w-5 opacity-80" />
            <div>
              <p className="text-xs font-medium opacity-90">Revenue</p>
              <p className="text-2xl font-bold leading-tight">₹{stats.revenue.toFixed(0)}</p>
            </div>
          </div>
          {/* Monthly Rev */}
          <div className="bg-[#0EA5E9] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <div className="h-5 w-5 opacity-80 flex items-center justify-center font-bold">📊</div>
            <div>
              <p className="text-xs font-medium opacity-90">Monthly Rev</p>
              <p className="text-2xl font-bold leading-tight">₹{(stats.monthlyRev / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-cream-dark/30 backdrop-blur-sm flex justify-start gap-1 p-1.5 h-14 rounded-2xl min-w-max border border-forest/5 shadow-soft">
              {isAdmin && <TabsTrigger value="overview" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Overview</TabsTrigger>}
              <TabsTrigger value="orders" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Orders</TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Products</TabsTrigger>
              <TabsTrigger value="offers" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Offers</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="staff" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Staff</TabsTrigger>}
              {isAdmin && <TabsTrigger value="delivery" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Logistics</TabsTrigger>}
              {isAdmin && <TabsTrigger value="settlements" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Invoices</TabsTrigger>}
              {isAdmin && <TabsTrigger value="commissions" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Earnings</TabsTrigger>}
              {isAdmin && <TabsTrigger value="whatsapp" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">WhatsApp</TabsTrigger>}
              <TabsTrigger value="chat" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Chat</TabsTrigger>
              <TabsTrigger value="feedback" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Feedback</TabsTrigger>
              <TabsTrigger value="videos" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Story</TabsTrigger>
              <TabsTrigger value="announcements" className="rounded-xl px-6 font-black uppercase text-[11px] tracking-widest transition-all data-[state=active]:bg-forest data-[state=active]:text-white data-[state=active]:shadow-lg">Announce</TabsTrigger>
            </TabsList>
          </div>

          {isAdmin && (
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="staff">
              <StaffTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="settlements">
              <CodLedgerTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="delivery">
              <DeliveryBoysTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="commissions">
              <CommissionsTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="whatsapp">
              <WhatsAppTab />
            </TabsContent>
          )}

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="offers">
            <OffersTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-forest transition-colors" />
                <Input
                  placeholder="Seach ID, Phone, Address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/50 border-forest/10 focus:border-forest/30 focus:ring-forest/5 rounded-xl h-12 font-bold transition-all"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as any)}
              >
                <SelectTrigger className="w-[200px] h-12 rounded-xl bg-white/50 border-forest/10 font-black text-[11px] uppercase tracking-widest">
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
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Orders Table */}
            <div className="border rounded-xl overflow-x-auto bg-card scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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
                        <TableCell className="font-mono font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM, p")}
                        </TableCell>
                        <TableCell>
                          <div>
                            {/* @ts-ignore - Extra attached properties */}
                            <p className="font-bold text-gray-900">{order.user_name || order.profiles?.full_name || "Unknown Customer"}</p>
                            <p className="font-medium text-sm text-gray-600">{order.phone}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {order.shipping_address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(order as any).order_items?.map((item: any) => (
                              <span key={item.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-forest/5 text-forest text-[10px] font-black rounded-md border border-forest/10 uppercase tracking-tighter">
                                {item.product_name} <span className="opacity-60 text-[9px] font-black">×{item.quantity}</span>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{Number(order.total_amount).toFixed(0)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} refundId={(order as any).refund_id} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDialogOpen(true);
                            }}
                          >
                            View Details
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

          <TabsContent value="chat">
            <ChatHistoryTab />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>

          <TabsContent value="videos">
            <MakingVideosTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusUpdate={() => {
          fetchOrders(); // Force refresh
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

export default AdminDashboard;
