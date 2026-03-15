import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    LineChart, Line, Legend
} from "recharts";
import { format, subDays, isAfter } from "date-fns";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OverviewTab() {
    const [orders, setOrders] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();

        // Subscribe to realtime updates for orders and subscriptions
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

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch Orders
            const { data: ordersData } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (ordersData) setOrders(ordersData);

            // Fetch Order Items for Product Sales Analysis
            const { data: itemsData } = await supabase
                .from("order_items")
                .select("*");

            if (itemsData) setOrderItems(itemsData);

            // Fetch Subscriptions
            const { data: subsData, error: subsError } = await (supabase as any)
                .from("subscriptions")
                .select("id, product_id, status")
                .eq("status", "active")
                .order("created_at", { ascending: false })
                .limit(5); // Just recent 5

            if (subsData) {
                // Handle manual join if needed based on previous fixes, 
                // but here we just try to get the basic info. If the DB fails, gracefully handle.
                try {
                    const productIds = [...new Set(subsData.map((s: any) => s.product_id).filter(Boolean))];
                    let productsMap: Record<string, any> = {};
                    if (productIds.length > 0) {
                        const { data: pData } = await (supabase as any)
                            .from("products")
                            .select("id, name")
                            .in("id", productIds);
                        if (pData) {
                            productsMap = pData.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
                        }
                    }
                    const mappedSubs = subsData.map((s: any) => ({
                        ...s,
                        products: s.product_id ? productsMap[s.product_id] : null
                    }));
                    setSubscriptions(mappedSubs);
                } catch (e) {
                    setSubscriptions(subsData);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // State for flexible Month filtering (Must be called before any early returns)
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading analytics...</div>;
    }

    // Filter orders and items by the explicitly selected month
    const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === selectedMonth.getMonth() &&
            orderDate.getFullYear() === selectedMonth.getFullYear();
    });

    const filteredOrderIds = new Set(filteredOrders.map(o => o.id));

    const filteredOrderItems = orderItems.filter((item) =>
        filteredOrderIds.has(item.order_id)
    );

    // 1. Product Sales Analysis Data (Based on filtered month)
    const productSalesMap = filteredOrderItems.reduce((acc: any, item: any) => {
        const name = item.product_name || 'Unknown';
        if (!acc[name]) acc[name] = 0;
        acc[name] += Number(item.quantity) || 0;
        return acc;
    }, {});
    const productSalesData = Object.keys(productSalesMap).map(name => ({
        name,
        "Quantity Sold": productSalesMap[name]
    })).sort((a, b) => b["Quantity Sold"] - a["Quantity Sold"]).slice(0, 5); // Top 5

    // 2. Order Status Distribution Data (Based on filtered month)
    const statusColors: Record<string, string> = {
        pending: "#F59E0B",
        processing: "#3B82F6",
        delivered: "#10B981",
        cancelled: "#EF4444",
        shipped: "#8B5CF6",
        paid: "#6366F1"
    };
    const statusMap = filteredOrders.reduce((acc: any, order: any) => {
        const status = order.status || 'pending';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {});
    const statusPieData = Object.keys(statusMap).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusMap[status],
        color: statusColors[status] || "#cbd5e1"
    }));

    // 3. Daily Revenue Trend (For the selected month)
    const daysInSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();

    // Create an array mapping each day of the selected month
    const monthDays = Array.from({ length: daysInSelectedMonth }).map((_, i) => {
        const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
        return format(d, 'MMM dd');
    });

    const dailyDataMap = monthDays.reduce((acc: any, dateStr) => {
        acc[dateStr] = { date: dateStr, Orders: 0, Revenue: 0 };
        return acc;
    }, {});

    filteredOrders.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'MMM dd');
        if (dailyDataMap[orderDate]) {
            dailyDataMap[orderDate].Orders += 1;
            if (order.status !== 'cancelled' && order.status !== 'pending') {
                dailyDataMap[orderDate].Revenue += Number(order.total_amount);
            }
        }
    });

    // To prevent the graph from looking incredibly cluttered if the whole month is empty,
    // we still provide the trendData, but Recharts handles empty arrays fine.
    const trendData = Object.values(dailyDataMap);

    // Calculate dynamic totals for the header cards
    const totalMonthlyRevenue = Number(trendData.reduce((sum: number, day: any) => sum + day.Revenue, 0));
    const totalMonthlyOrders = filteredOrders.length;

    return (
        <div className="space-y-6">
            {/* Header with Month View Picker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
                    <p className="text-sm text-gray-500">
                        {format(selectedMonth, 'MMMM yyyy')} • {totalMonthlyOrders} Orders • ₹{totalMonthlyRevenue} Revenue
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter View:</label>
                    <input
                        type="month"
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        value={format(selectedMonth, 'yyyy-MM')}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [year, month] = e.target.value.split('-');
                                setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                            }
                        }}
                    />
                </div>
            </div>

            <Card className="bg-[#FAF9F6] border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                        <span className="text-gray-600">📈</span> Revenue Trend ({format(selectedMonth, 'MMMM')})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    stroke="#718096"
                                    interval="preserveStartEnd"
                                    minTickGap={20}
                                />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#718096" />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#718096" />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line yAxisId="left" type="monotone" dataKey="Orders" stroke="#4299E1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="Revenue" name="Revenue (₹)" stroke="#48BB78" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#FAF9F6] border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                            <span className="text-green-600">📊</span> Top Products ({format(selectedMonth, 'MMM')})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productSalesData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No sales data for {format(selectedMonth, 'MMMM')}</div>
                        ) : (
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} stroke="#718096" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#718096" />
                                        <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="Quantity Sold" fill="#4299E1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-[#FAF9F6] border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                            <span className="text-green-600">📦</span> Order Distribution ({format(selectedMonth, 'MMM')})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {statusPieData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No orders in {format(selectedMonth, 'MMMM')}</div>
                        ) : (
                            <div className="h-[250px] w-full max-w-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
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
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#FAF9F6] border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2D3748]">
                            <span className="text-green-600">📦</span> Recent Orders ({format(selectedMonth, 'MMM')})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredOrders.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 text-center">No orders found for this month.</p>
                            ) : filteredOrders.slice(0, 5).map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-gray-100 shadow-sm">
                                    <div>
                                        <p className="font-mono text-xs font-bold text-gray-800">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <p className="text-[10px] text-gray-500">{order.phone}</p>
                                            {order.razorpay_payment_id && (
                                                <p className="text-[10px] text-emerald-600 font-medium">TXN: {order.razorpay_payment_id}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className="text-sm font-bold">₹{order.total_amount}</p>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
                            ) : subscriptions.map(sub => (
                                <div key={sub.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-gray-100 shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{sub.products?.name || 'Loading Product...'}</p>
                                        <p className="text-[10px] text-gray-500">{sub.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium">{sub.quantity}x</p>
                                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">Active</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
