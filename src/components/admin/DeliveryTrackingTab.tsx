import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Truck, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Filter,
  UserCheck,
  Package,
  Search,
  CheckCircle,
  BarChart4
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DeliveryStatsCard } from "@/components/delivery/DeliveryStatsCard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function DeliveryTrackingTab() {
  const [stats, setStats] = useState({ delivered: 0, pending: 0, skipped: 0, total: 0 });
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Deliveries for the selected date
      const { data: drops, error: dropsError } = await supabase
        .from('deliveries')
        .select(`
          *,
          subscription_items(
            quantity,
            delivery_time,
            selected_weight,
            unit_type,
            products(name, image_url),
            subscriptions(
              address,
              profiles(full_name, phone)
            )
          )
        `)
        .eq('delivery_date', selectedDate);
      
      if (dropsError) throw dropsError;
      setDeliveries(drops || []);

      // Calculate Stats
      if (drops) {
        const s = { delivered: 0, pending: 0, skipped: 0, total: drops.length };
        drops.forEach(d => {
          if (d.status === 'delivered') s.delivered++;
          else if (d.status === 'skipped') s.skipped++;
          else s.pending++;
        });
        setStats(s);
      }

      // 2. Fetch Delivery Boys
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery_boy' as any);
        
      const { data: staffData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', rolesData?.map(r => r.user_id) || []);
        
      setStaff(staffData || []);

    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // --- REPORT CALCULATIONS ---
  
  // 1. Product Aggregation (Loading Summary)
  const productSummary = deliveries.reduce((acc: any, d: any) => {
    const productName = d.subscription_items?.products?.name || "Unknown";
    const qty = Number(d.subscription_items?.quantity || 0);
    if (!acc[productName]) acc[productName] = 0;
    acc[productName] += qty;
    return acc;
  }, {});

  // 2. Rider Performance
  const riderPerformance = staff.map(s => {
    const riderDrops = deliveries.filter(d => d.delivery_boy_id === s.user_id);
    return {
        name: s.full_name,
        total: riderDrops.length,
        delivered: riderDrops.filter(d => d.status === 'delivered').length,
        skipped: riderDrops.filter(d => d.status === 'skipped').length
    };
  }).filter(r => r.total > 0);

  const assignRider = async (deliveryId: string, riderId: string) => {
    const { error } = await supabase
      .from('deliveries')
      .update({ delivery_boy_id: riderId === 'unassign' ? null : riderId })
      .eq('id', deliveryId);

    if (error) {
      toast({ title: "Failed to assign", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rider Updated" });
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, delivery_boy_id: riderId === 'unassign' ? null : riderId } : d));
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const customer = d.subscription_items?.subscriptions?.profiles?.full_name || "";
    const phone = d.subscription_items?.subscriptions?.profiles?.phone || "";
    const matchesSearch = customer.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    const matchesSlot = slotFilter === 'all' || d.delivery_slot === slotFilter;
    const matchesStatus = statusFilter === 'all' || 
                        (statusFilter === 'pending' ? d.status === 'pending' : 
                         statusFilter === 'delivered' ? d.status === 'delivered' :
                         statusFilter === 'skipped' ? d.status === 'skipped' : true);
    return matchesSearch && matchesSlot && matchesStatus;
  });

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Report Header & Date Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                <BarChart4 className="w-7 h-7" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Delivery Report</h2>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Daily Operations Insights</p>
            </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Date:</p>
            <Input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 border-none bg-emerald-50/50 rounded-xl font-bold text-emerald-700 focus-visible:ring-0 w-40"
            />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DeliveryStatsCard title="Total Load" value={stats.total} label="Total Drops" icon={Truck} variant="slate" />
        <DeliveryStatsCard title="Delivered" value={stats.delivered} label="Success" icon={CheckCircle2} variant="emerald" />
        <DeliveryStatsCard title="Skipped" value={stats.skipped} label="Issues Found" icon={XCircle} variant="rose" />
        <DeliveryStatsCard title="Pending" value={stats.pending} label="In Progress" icon={Clock} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loading Summary (Farm Operations) */}
        <Card className="lg:col-span-1 border-none shadow-xl rounded-[32px] overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Package className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-emerald-400">Loading Summary</h3>
                </div>
                <div className="space-y-4">
                    {Object.entries(productSummary).map(([name, qty]: any) => (
                        <div key={name} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                            <span className="font-bold text-slate-300">{name}</span>
                            <span className="text-xl font-black text-emerald-400">{qty} <span className="text-[10px] uppercase tracking-tighter opacity-70">Units</span></span>
                        </div>
                    ))}
                    {Object.keys(productSummary).length === 0 && (
                        <p className="text-xs text-slate-500 italic py-4">No drops scheduled for this date.</p>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Rider Progress */}
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Rider Performance</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riderPerformance.map(r => (
                        <div key={r.name} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-slate-800 uppercase text-[11px] tracking-tight">{r.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{r.delivered}/{r.total} DONE</span>
                             </div>
                             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${(r.delivered / r.total) * 100}%` }}
                                />
                             </div>
                             <div className="flex gap-4 mt-3">
                                <p className="text-[9px] font-black text-emerald-600 tracking-widest">SUCCESS: {r.delivered}</p>
                                <p className="text-[9px] font-black text-rose-500 tracking-widest">SKIPS: {r.skipped}</p>
                             </div>
                        </div>
                    ))}
                    {riderPerformance.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-4">No active deliveries assigned yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search customer or phone..." 
            className="pl-10 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all shadow-inner"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={slotFilter} onValueChange={setSlotFilter}>
            <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50 border-slate-100 font-bold uppercase text-[10px] tracking-widest">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Full Day</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50 border-slate-100 font-bold uppercase text-[10px] tracking-widest text-emerald-600">
              <SelectValue placeholder="Dispatch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drops</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} className="h-12 w-12 rounded-xl p-0 hover:bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Assignment Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
               <tr>
                  <th className="p-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer Details</th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Product/Qty</th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Slot</th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Assign Rider</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredDeliveries.map((drop) => (
                 <tr key={drop.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                       <div className="space-y-1">
                          <p className="font-black text-slate-900 uppercase tracking-tight">{drop.subscription_items?.subscriptions?.profiles?.full_name || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-slate-400 leading-none truncate max-w-[200px]">{drop.subscription_items?.subscriptions?.address}</p>
                       </div>
                    </td>
                    <td className="p-5">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                             <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-700">{drop.subscription_items?.products?.name}</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{drop.subscription_items?.quantity} Units</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-5">
                       <Badge variant="outline" className={cn(
                         "uppercase text-[9px] font-black tracking-widest px-2 py-1 rounded-lg border-slate-100",
                         drop.delivery_slot === 'morning' ? "text-blue-600 bg-blue-50" : "text-amber-600 bg-amber-50"
                       )}>
                          {drop.delivery_slot || "Morning"}
                       </Badge>
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               drop.status === 'delivered' ? "bg-emerald-500" : drop.status === 'skipped' ? "bg-rose-500" : "bg-amber-400 animate-pulse"
                             )} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{drop.status}</span>
                          </div>
                          {drop.status === 'skipped' && drop.notes && (
                            <p className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 max-w-[140px] truncate" title={drop.notes}>
                              Reason: {drop.notes}
                            </p>
                          )}
                       </div>
                    </td>
                    <td className="p-5 text-right">
                       <Select 
                        value={drop.delivery_boy_id || "unassign"} 
                        onValueChange={(val) => assignRider(drop.id, val)}
                       >
                          <SelectTrigger className={cn(
                            "w-[180px] h-10 rounded-xl font-bold ml-auto transition-all",
                            drop.delivery_boy_id ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-400"
                          )}>
                             <SelectValue placeholder="Assign Rider" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                             <SelectItem value="unassign" className="text-rose-500 font-bold">❌ Unassign</SelectItem>
                             {staff.map(s => (
                               <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </td>
                 </tr>
               ))}
               {filteredDeliveries.length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-20 text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="w-8 h-8 text-slate-200" />
                       </div>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching deliveries found</p>
                    </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
