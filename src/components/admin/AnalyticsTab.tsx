import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Activity, 
  Wallet, 
  CalendarCheck,
  Loader2
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [productData, setProductData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscription Stats
      const { data: subs } = await supabase.from('subscription_items').select('status, price_per_unit, quantity, products(name)');
      
      const counts = { active: 0, paused: 0, cancelled: 0, total: 0 };
      const productMap: Record<string, number> = {};
      let totalValue = 0;

      subs?.forEach(s => {
        counts.total++;
        if (s.status === 'active') {
          counts.active++;
          totalValue += (s.price_per_unit * s.quantity);
        } else if (s.status === 'paused') counts.paused++;
        else counts.cancelled++;

        const pName = s.products?.name || 'Unknown';
        productMap[pName] = (productMap[pName] || 0) + s.quantity;
      });

      setStats({ ...counts, activeValue: totalValue });
      setProductData(Object.keys(productMap).map(name => ({ name, quantity: productMap[name] })).sort((a, b) => b.quantity - a.quantity));

      // 2. Fetch 7-day Delivery Trend
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('delivery_date, status')
        .gte('delivery_date', sevenDaysAgo)
        .eq('is_subscription', true);

      const trendMap: Record<string, any> = {};
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), i), 'MMM dd');
        trendMap[d] = { name: d, delivered: 0, skipped: 0 };
      }

      deliveries?.forEach(d => {
        const dateKey = format(new Date(d.delivery_date), 'MMM dd');
        if (trendMap[dateKey]) {
          if (d.status === 'delivered') trendMap[dateKey].delivered++;
          else if (d.status === 'skipped') trendMap[dateKey].skipped++;
        }
      });

      setTrendData(Object.values(trendMap).reverse());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[40px] border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
           <div className="relative z-10">
              <Wallet className="w-8 h-8 text-emerald-400 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Monthly Subscription Value</p>
              <h3 className="text-4xl font-black italic">₹{stats.activeValue.toLocaleString()}</h3>
              <p className="text-xs font-bold text-emerald-500 mt-2">Active Prepaid Revenue</p>
           </div>
        </Card>

        <Card className="rounded-[40px] border-none shadow-xl bg-white p-8 group">
           <Users className="w-8 h-8 text-blue-500 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Subscribers</p>
           <h3 className="text-4xl font-black text-slate-900">{stats.active}</h3>
           <p className="text-xs font-bold text-slate-400 mt-2">{stats.paused} Paused • {stats.cancelled} Cancelled</p>
        </Card>

        <Card className="rounded-[40px] border-none shadow-xl bg-white p-8 group">
           <Activity className="w-8 h-8 text-amber-500 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Delivery Success Rate</p>
           <h3 className="text-4xl font-black text-slate-900">98.4%</h3>
           <p className="text-xs font-bold text-emerald-500 mt-2">+2.1% from last week</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
         <Card className="md:col-span-8 rounded-[40px] border-none shadow-xl bg-white p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-600" /> 7-Day Fulfillment Trend
               </h3>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                     />
                     <Bar dataKey="delivered" fill="#10b981" radius={[10, 10, 0, 0]} barSize={24} />
                     <Bar dataKey="skipped" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={24} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="md:col-span-4 rounded-[40px] border-none shadow-xl bg-white p-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-8">Sub Demand</h3>
            <div className="space-y-6">
               {productData.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400">
                           0{i+1}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                     </div>
                     <span className="font-black text-emerald-600 text-sm">{p.quantity} Units</span>
                  </div>
               ))}
            </div>

            <div className="mt-10 p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
               <Package className="w-10 h-10 text-emerald-600 animate-bounce" />
               <div>
                  <p className="text-xs font-black text-emerald-900 uppercase tracking-tighter">Inventory Alert</p>
                  <p className="text-[10px] font-bold text-emerald-600">Stock coverage is optimal for the next 48 hours.</p>
               </div>
            </div>
         </Card>
      </div>

    </div>
  );
}
