import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatHistoryTab } from "@/components/admin/ChatHistoryTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { SubscriptionsTab } from "@/components/admin/SubscriptionsTab";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { StaffTab } from "@/components/admin/StaffTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CommissionsTab } from "@/components/admin/CommissionsTab";
import { DeliveryBoysTab } from "@/components/admin/DeliveryBoysTab";
import { useTranslation } from "react-i18next";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeSubsCount, setActiveSubsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { signOut } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<string>("orders");

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

    const fetchSubsCount = async () => {
      const { count } = await (supabase as any)
        .from("subscriptions")
        .select('*', { count: 'exact', head: true })
        .eq("status", "active");
      if (count !== null) setActiveSubsCount(count);
    };
    fetchSubsCount();

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        (payload) => {
          console.log("Subscription update:", payload);
          fetchSubsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.shipping_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    activeSubs: activeSubsCount
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/delivery/dashboard")} className="flex">
              <Package className="h-4 w-4 mr-2" />
              Delivery Mode
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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
          {/* Active Subs */}
          <div className="bg-[#EC4899] rounded-xl p-4 text-white shadow flex flex-col justify-between h-[100px]">
            <div className="h-5 w-5 opacity-80 flex items-center justify-center font-bold text-lg">📅</div>
            <div>
              <p className="text-xs font-medium opacity-90">Active Subs</p>
              <p className="text-2xl font-bold leading-tight">{stats.activeSubs}</p>
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
            <TabsList className="bg-[#f0ece1] flex justify-start gap-1 p-1 h-12 rounded-lg min-w-max">
              {isAdmin ? <TabsTrigger value="overview" className="rounded-md px-4 whitespace-nowrap">Overview</TabsTrigger> : null}
              <TabsTrigger value="orders" className="rounded-md px-4 whitespace-nowrap">Orders</TabsTrigger>
              <TabsTrigger value="subscriptions" className="rounded-md px-4 whitespace-nowrap">Subs</TabsTrigger>
              <TabsTrigger value="products" className="rounded-md px-4 whitespace-nowrap">Products</TabsTrigger>
              {isSuperAdmin ? <TabsTrigger value="staff" className="rounded-md px-4 whitespace-nowrap">Staff</TabsTrigger> : null}
              {isAdmin ? <TabsTrigger value="delivery" className="rounded-md px-4 whitespace-nowrap">Delivery Boys</TabsTrigger> : null}
              {isAdmin ? <TabsTrigger value="commissions" className="rounded-md px-4 whitespace-nowrap">Commissions</TabsTrigger> : null}
              <TabsTrigger value="chat" className="rounded-md px-4 whitespace-nowrap">Chat</TabsTrigger>
              <TabsTrigger value="feedback" className="rounded-md px-4 whitespace-nowrap">Feedback</TabsTrigger>
              <TabsTrigger value="announcements" className="rounded-md px-4 whitespace-nowrap">Announce</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-md px-4 whitespace-nowrap text-muted-foreground" disabled>Settings</TabsTrigger>
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
            <TabsContent value="delivery">
              <DeliveryBoysTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="commissions">
              <CommissionsTab />
            </TabsContent>
          )}

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as OrderStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                            <p className="font-bold text-gray-900">{order.profiles?.full_name || "Unknown Customer"}</p>
                            <p className="font-medium text-sm text-gray-600">{order.phone}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {order.shipping_address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{Number(order.total_amount).toFixed(0)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
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

          <TabsContent value="subscriptions">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
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
    </div>
  );
};

export default AdminDashboard;
