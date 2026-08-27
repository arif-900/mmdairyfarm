import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from "recharts";
import { format } from "date-fns";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    Package, 
    Users,
    ArrowUpRight,
    ShoppingBag,
    CalendarHeart,
    AlertCircle,
    MessageSquare,
    HandCoins
} from "lucide-react";

export function OverviewTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
    const [orders, setOrders] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const [activeSubs, setActiveSubs] = useState(0);
    const [lowStock, setLowStock] = useState(0);
    const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);
    const [codPending, setCodPending] = useState(0);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch Orders
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (ordersError) {
                console.error("Error fetching orders:", ordersError);
            } else if (ordersData) {
                setOrders(ordersData);
            }

            // Fetch Order Items
            const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select("*");

            if (itemsError) {
                console.error("Error fetching order items:", itemsError);
            } else if (itemsData) {
                setOrderItems(itemsData);
            }

            // Fetch Active Subscriptions count
            const { count: subsCount } = await supabase
                .from("subscription_items")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");
            setActiveSubs(subsCount || 0);

            // Fetch Low Stock count (stock <= 10)
            const { data: productsData } = await supabase
                .from("products")
                .select("stock");
            const lowStockCount = productsData?.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 10).length || 0;
            setLowStock(lowStockCount);

            // Fetch Unread Feedback count
            const { count: feedbackCount } = await supabase
                .from("feedbacks")
                .select("*", { count: "exact", head: true })
                .neq("status", "resolved");
            setUnreadFeedbacks(feedbackCount || 0);

            // Fetch COD pending amount
            const { data: codPendingData } = await supabase
                .from("orders")
                .select("total_amount")
                .eq("payment_method", "cod")
                .not("status", "in", '("delivered","cancelled")');
            const codPendingSum = codPendingData?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
            setCodPending(codPendingSum);

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        const channel = supabase
            .channel("admin-overview")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => fetchDashboardData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Loading analytics...
            </div>
        );
    }

    const filteredOrders = orders.filter((order) => {
        if (!order?.created_at) return false;
        const d = new Date(order.created_at);
        return (
            d.getMonth() === selectedMonth.getMonth() &&
            d.getFullYear() === selectedMonth.getFullYear()
        );
    });

    const filteredOrderIds = new Set(filteredOrders.map((o) => o?.id));

    const filteredOrderItems = orderItems.filter((item) =>
        filteredOrderIds.has(item?.order_id)
    );

    const productSalesMap = filteredOrderItems.reduce((acc: any, item: any) => {
        const name = item?.product_name || "Unknown";
        if (!acc[name]) acc[name] = 0;
        acc[name] += Number(item?.quantity) || 0;
        return acc;
    }, {});

    const productSalesData = Object.keys(productSalesMap)
        .map((name) => ({
            name,
            "Quantity Sold": productSalesMap[name],
        }))
        .sort((a, b) => b["Quantity Sold"] - a["Quantity Sold"])
        .slice(0, 5);

    const statusColors: Record<string, string> = {
        pending: "#F59E0B",
        processing: "#3B82F6",
        delivered: "#10B981",
        cancelled: "#EF4444",
        shipped: "#8B5CF6",
        paid: "#6366F1",
    };

    const statusMap = filteredOrders.reduce((acc: any, order: any) => {
        const status = (order?.status || "pending").toLowerCase();
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {});

    const statusPieData = Object.keys(statusMap).map((status) => {
        const safeStatus = typeof status === "string" ? status : "unknown";
        return {
            name: safeStatus
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            value: statusMap[status],
            color: statusColors[safeStatus] || "#cbd5e1",
        };
    });

    const daysInSelectedMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0
    ).getDate();

    const monthDays = Array.from({ length: daysInSelectedMonth }).map((_, i) =>
        format(
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1),
            "MMM dd"
        )
    );

    const dailyDataMap = monthDays.reduce((acc: any, dateStr) => {
        acc[dateStr] = { date: dateStr, Orders: 0, Revenue: 0 };
        return acc;
    }, {});

    filteredOrders.forEach((order) => {
        if (!order?.created_at) return;
        const orderDate = format(new Date(order.created_at), "MMM dd");
        if (dailyDataMap[orderDate]) {
            dailyDataMap[orderDate].Orders += 1;
            if (order.status !== "cancelled" && order.status !== "pending") {
                dailyDataMap[orderDate].Revenue += Number(order?.total_amount) || 0;
            }
        }
    });

    const trendData = Object.values(dailyDataMap);

    const totalMonthlyRevenue = (trendData as { Revenue: number }[]).reduce(
        (sum: number, day) => sum + (day.Revenue || 0),
        0
    );

    const totalMonthlyOrders = filteredOrders.length;

    const dailyOrders = orders.filter(o => {
        if (!o.created_at) return false;
        return format(new Date(o.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    });

    const dailyRevenue = dailyOrders.reduce((sum, o) => 
        (o.status !== 'pending' && o.status !== 'cancelled') ? sum + Number(o.total_amount || 0) : sum, 0
    );

    return (
        <div className="space-y-8 text-[#F5F3EC]">
            {/* Metric Overview Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Today's Revenue */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">Today's Revenue</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#C98A24]">₹{dailyRevenue.toFixed(0)}</h3>
                        <p className="text-[8px] text-[#4ADE80] font-bold mt-0.5">+{dailyOrders.length} orders today</p>
                    </CardContent>
                </Card>

                {/* 2. Today's Orders */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">Today's Orders</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#F5F3EC]">{dailyOrders.length}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Real-time status</p>
                    </CardContent>
                </Card>

                {/* 3. Active Subscriptions */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <CalendarHeart className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">Active Subscriptions</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#C98A24]">{activeSubs}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Recurring cycles active</p>
                    </CardContent>
                </Card>

                {/* 4. Low Stock Alerts */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertCircle className="h-10 w-10 text-amber-500" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">Low Stock Alerts</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-amber-400">{lowStock}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Items &lt;= 10 units</p>
                    </CardContent>
                </Card>

                {/* 5. COD Collections Pending */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <HandCoins className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">COD Pending</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#C98A24]">₹{codPending.toFixed(0)}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Outstanding in field</p>
                    </CardContent>
                </Card>

                {/* 6. Unread Feedback */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">Unresolved Feedback</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#C98A24]">{unreadFeedbacks}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Requires operational review</p>
                    </CardContent>
                </Card>

                {/* 7. Selected Month Revenue */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">{format(selectedMonth, "MMM")} Revenue</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#C98A24]">₹{totalMonthlyRevenue.toFixed(0)}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Total completed &amp; paid</p>
                    </CardContent>
                </Card>

                {/* 8. Selected Month Orders */}
                <Card className="bg-[#0B2118] border border-white/10 overflow-hidden relative group rounded-2xl shadow-xl text-[#F5F3EC]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="h-10 w-10 text-[#C98A24]" />
                    </div>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#AAB8B0]">{format(selectedMonth, "MMM")} Orders</p>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <h3 className="text-xl font-black text-[#F5F3EC]">{totalMonthlyOrders}</h3>
                        <p className="text-[8px] text-[#AAB8B0] font-bold mt-0.5">Volume for this period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#0B2118] p-6 rounded-2xl border border-white/10 shadow-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C98A24] flex items-center gap-2">
                    ⚡ Quick Operations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button onClick={() => onTabChange?.("products")} className="flex flex-col items-center justify-center p-4 bg-[#10291F] hover:bg-[#164431] border border-white/10 rounded-xl transition-all group text-center gap-2">
                        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">📦</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F5F3EC]">+ Add Product</span>
                    </button>
                    
                    <button onClick={() => onTabChange?.("whatsapp")} className="flex flex-col items-center justify-center p-4 bg-[#10291F] hover:bg-[#164431] border border-white/10 rounded-xl transition-all group text-center gap-2">
                        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">💬</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F5F3EC]">Broadcast WhatsApp</span>
                    </button>

                    <button onClick={() => onTabChange?.("offers")} className="flex flex-col items-center justify-center p-4 bg-[#10291F] hover:bg-[#164431] border border-white/10 rounded-xl transition-all group text-center gap-2">
                        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">🏷️</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F5F3EC]">+ Create Offer</span>
                    </button>

                    <button onClick={() => onTabChange?.("announcements")} className="flex flex-col items-center justify-center p-4 bg-[#10291F] hover:bg-[#164431] border border-white/10 rounded-xl transition-all group text-center gap-2">
                        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">📢</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F5F3EC]">Announce</span>
                    </button>

                    <button onClick={() => onTabChange?.("tracking")} className="flex flex-col items-center justify-center p-4 bg-[#10291F] hover:bg-[#164431] border border-white/10 rounded-xl transition-all group text-center gap-2">
                        <span className="text-2xl font-bold group-hover:scale-110 transition-transform">🚚</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F5F3EC]">Route Tracking</span>
                    </button>
                </div>
            </div>

            {/* Header with Month Picker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B2118] p-4 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#10291F] rounded-xl text-[#C98A24] border border-white/10">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[#F5F3EC] uppercase tracking-tight">Financial Trends</h2>
                        <p className="text-[11px] text-[#AAB8B0] font-bold">
                            Analyzing {format(selectedMonth, "MMMM yyyy")} Lifecycle
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        className="bg-[#10291F] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-[#F5F3EC] focus:border-[#C98A24] outline-none shadow-sm transition-all"
                        value={format(selectedMonth, "yyyy-MM")}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [year, month] = e.target.value.split("-");
                                setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                            }
                        }}
                    />
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <Card className="bg-[#0B2118] border border-white/10 shadow-xl text-[#F5F3EC]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#F5F3EC]">
                        <span>📈</span> Revenue Trend ({format(selectedMonth, "MMMM")})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: "#AAB8B0" }} stroke="rgba(255,255,255,0.2)" interval="preserveStartEnd" minTickGap={20} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12, fontWeight: 700, fill: "#AAB8B0" }} stroke="rgba(255,255,255,0.2)" />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fontWeight: 700, fill: "#AAB8B0" }} stroke="rgba(255,255,255,0.2)" />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        borderRadius: "12px", 
                                        border: "1px solid rgba(255,255,255,0.12)", 
                                        backgroundColor: "#061A13",
                                        color: "#F5F3EC"
                                    }} 
                                />
                                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 700, paddingTop: "20px", color: "#F5F3EC" }} />
                                <Line yAxisId="left" type="monotone" dataKey="Orders" stroke="#4ADE80" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#061A13" }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="Revenue" name="Revenue (₹)" stroke="#C98A24" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#061A13" }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card className="bg-[#0B2118] border border-white/10 shadow-xl text-[#F5F3EC]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#F5F3EC]">
                            <span>📊</span> Top Products ({format(selectedMonth, "MMM")})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productSalesData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-[#AAB8B0] text-sm">
                                No sales data for {format(selectedMonth, "MMMM")}
                            </div>
                        ) : (
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#AAB8B0" }} angle={-45} textAnchor="end" height={60} stroke="rgba(255,255,255,0.2)" />
                                        <YAxis tick={{ fontSize: 12, fontWeight: 700, fill: "#AAB8B0" }} stroke="rgba(255,255,255,0.2)" />
                                        <RechartsTooltip 
                                            contentStyle={{ 
                                                borderRadius: "12px", 
                                                border: "1px solid rgba(255,255,255,0.12)", 
                                                backgroundColor: "#061A13",
                                                color: "#F5F3EC"
                                            }} 
                                        />
                                        <Bar dataKey="Quantity Sold" fill="#C98A24" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Distribution Pie */}
                <Card className="bg-[#0B2118] border border-white/10 shadow-xl text-[#F5F3EC]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#F5F3EC]">
                            <span>📦</span> Order Distribution ({format(selectedMonth, "MMM")})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {statusPieData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-[#AAB8B0] text-sm">
                                No orders in {format(selectedMonth, "MMMM")}
                            </div>
                        ) : (
                            <div className="h-[250px] w-full max-w-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {statusPieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ 
                                                borderRadius: "12px", 
                                                border: "1px solid rgba(255,255,255,0.12)", 
                                                backgroundColor: "#061A13",
                                                color: "#F5F3EC"
                                            }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card className="bg-[#0B2118] border border-white/10 shadow-xl text-[#F5F3EC]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#F5F3EC]">
                        <span>📦</span> Recent Orders ({format(selectedMonth, "MMM")})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredOrders.length === 0 ? (
                            <p className="text-sm text-[#AAB8B0] py-4 text-center">No orders found for this month.</p>
                        ) : filteredOrders.slice(0, 5).map((order) => (
                            <div key={order?.id} className="bg-[#10291F] p-4 rounded-xl flex items-center justify-between border border-white/10 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#061A13] rounded-xl border border-white/10 text-[#C98A24]">
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-xs font-bold text-[#F5F3EC]">
                                            #{order?.id?.slice(0, 8)?.toUpperCase()}
                                        </p>
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <p className="text-[10px] text-[#AAB8B0] font-bold">{order?.phone}</p>
                                            {(order as any)?.razorpay_payment_id && (
                                                <p className="text-[10px] text-[#C98A24] font-bold">
                                                    TXN: {(order as any).razorpay_payment_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5">
                                    <p className="text-sm font-black text-[#C98A24]">₹{order?.total_amount}</p>
                                    <OrderStatusBadge status={order?.status} refundId={(order as any).refund_id} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
