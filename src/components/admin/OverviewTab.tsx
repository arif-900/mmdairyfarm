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

export function OverviewTab() {
    const [orders, setOrders] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            ```
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

// Fetch Active Subscriptions
const { data: subsData, error: subsError } = await (supabase as any)
  .from("subscriptions")
  .select("id, product_id, status, quantity")
  .eq("status", "active")
  .limit(5);

if (subsError) {
  console.error("Error fetching subscriptions:", subsError);
  return;
}

if (subsData && subsData.length > 0) {
  const productIds = [
    ...new Set(subsData.map((s: any) => s.product_id).filter(Boolean)),
  ];

  let productsMap: Record<string, any> = {};

  if (productIds.length > 0) {
    const { data: pData, error: productError } = await (supabase as any)
      .from("products")
      .select("id, name")
      .in("id", productIds);

    if (productError) {
      console.error("Error fetching products:", productError);
    }

    if (pData) {
      productsMap = pData.reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }
  }

  const mappedSubs = subsData.map((s: any) => ({
    ...s,
    products: s.product_id ? productsMap[s.product_id] : null,
  }));

  setSubscriptions(mappedSubs);
}
```

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
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "subscriptions" },
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

    const totalMonthlyRevenue = trendData.reduce(
        (sum: number, day: any) => sum + day.Revenue,
        0
    );

    const totalMonthlyOrders = filteredOrders.length;

    return (
        <div className="space-y-6">
            {/* Header with Month Picker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
                    <p className="text-sm text-gray-500">
                        {format(selectedMonth, "MMMM yyyy")} • {totalMonthlyOrders} Orders • ₹{totalMonthlyRevenue.toFixed(0)} Revenue
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter View:</label>
                    <input
                        type="month"
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
            <Card className="bg-[#FAF9F6] border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                        <span className="text-gray-600">📈</span> Revenue Trend ({format(selectedMonth, "MMMM")})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#718096" interval="preserveStartEnd" minTickGap={20} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#718096" />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#718096" />
                                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Line yAxisId="left" type="monotone" dataKey="Orders" stroke="#4299E1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="Revenue" name="Revenue (₹)" stroke="#48BB78" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card className="bg-[#FAF9F6] border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                            <span className="text-green-600">📊</span> Top Products ({format(selectedMonth, "MMM")})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productSalesData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                                No sales data for {format(selectedMonth, "MMMM")}
                            </div>
                        ) : (
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} stroke="#718096" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#718096" />
                                        <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                                        <Bar dataKey="Quantity Sold" fill="#4299E1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Distribution Pie */}
                <Card className="bg-[#FAF9F6] border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                            <span className="text-green-600">📦</span> Order Distribution ({format(selectedMonth, "MMM")})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {statusPieData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
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
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                                const rad = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * rad);
                                                const y = cy + radius * Math.sin(-midAngle * rad);
                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                );
                                            }}
                                        >
                                            {statusPieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card className="bg-[#FAF9F6] border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                        <span className="text-green-600">📦</span> Recent Orders ({format(selectedMonth, "MMM")})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredOrders.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No orders found for this month.</p>
                        ) : filteredOrders.slice(0, 5).map((order) => (
                            <div key={order?.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-gray-100 shadow-sm">
                                <div>
                                    <p className="font-mono text-xs font-bold text-gray-800">
                                        #{order?.id?.slice(0, 8)?.toUpperCase()}
                                    </p>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <p className="text-[10px] text-gray-500">{order?.phone}</p>
                                        {(order as any)?.razorpay_payment_id && (
                                            <p className="text-[10px] text-emerald-600 font-medium">
                                                TXN: {(order as any).razorpay_payment_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <p className="text-sm font-bold">₹{order?.total_amount}</p>
                                    <OrderStatusBadge status={order?.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card className="bg-[#FAF9F6] border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                        <span className="text-green-600">📅</span> Active Subscriptions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {subscriptions.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No active subscriptions right now.</p>
                        ) : subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-gray-100 shadow-sm">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{sub.products?.name || "Loading Product..."}</p>
                                    <p className="text-[10px] text-gray-500">{sub.id?.slice(0, 8)?.toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium">{sub.quantity ?? 1}x</p>
                                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">Active</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
