import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CalendarRange, 
  MapPin, 
  Power, 
  PowerOff, 
  Package, 
  Calendar,
  Clock,
  Trash2,
  ChevronRight,
  Zap,
  AlertCircle,
  TrendingDown
} from "lucide-react";
import { format, differenceInDays, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/utils/pricing";

interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id: string;
  quantity: number;
  plan_type: string;
  delivery_time: string;
  status: string;
  start_date: string;
  end_date: string | null;
  next_delivery_date: string;
  price_per_unit: number;
  selected_weight: number | null;
  unit_type: string | null;
  products?: { name: string; image_url: string | null };
  subscriptions?: { address: string };
}

export function MySubscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_items')
        .select(`
          id, subscription_id, product_id, quantity, plan_type, delivery_time, status, start_date, end_date, next_delivery_date, price_per_unit, selected_weight, unit_type,
          products (name, image_url),
          subscriptions (address)
        `)
        .neq('status', 'cancelled') // Hide cancelled from main list to keep it clean
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data as any);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    setProcessingId(id);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('subscription_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: `Subscription ${newStatus === 'active' ? 'Resumed' : 'Paused'}`,
        description: newStatus === 'active' ? "Your deliveries will resume as scheduled." : "Deliveries have been temporarily stopped."
      });
      fetchSubscriptions();
    } catch(err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const cancelSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to cancel? The remaining balance will be automatically refunded to your wallet as coins.")) return;
    
    setProcessingId(id);
    try {
      // Use RPC for atomic cancellation and refund
      const { data, error } = await supabase.rpc('refund_subscription_to_wallet', { 
        p_item_id: id 
      });

      if (error) throw error;

      if (data?.success) {
        toast({ 
          title: "Subscription Cancelled", 
          description: `₹${data.refunded_amount} has been refunded to your wallet.`,
        });
      } else {
        toast({ title: "Cancellation Error", description: data?.message || "Unknown error", variant: "destructive" });
      }
      
      fetchSubscriptions();
    } catch(err: any) {
      console.error("Cancellation error:", err);
      toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const days = differenceInDays(new Date(endDate), new Date());
    return days >= 0 && days <= 3;
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return isBefore(new Date(endDate), new Date());
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-inner">
        <CalendarRange className="w-20 h-20 mx-auto text-slate-200 mb-6" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">No Active Drops</h2>
        <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8 leading-snug">
          Your delivery calendar is empty. Select a product to start your first farm-fresh subscription.
        </p>
        <Button 
          onClick={() => window.location.href = '/products'}
          className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all"
        >
          View Products
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      {items.map(item => {
        const expiring = isExpiringSoon(item.end_date) && item.status === 'active';
        const expired = isExpired(item.end_date);
        const resolvedStatus = expired ? 'EXPIRED' : item.status;

        return (
        <Card key={item.id} className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white group hover:shadow-2xl transition-all duration-500 relative">
            {/* Expiry Alert Bar */}
            {expiring && (
              <div className="bg-amber-100 text-amber-700 px-6 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-b border-amber-200/50 animate-in slide-in-from-top duration-500">
                <AlertCircle className="w-3.5 h-3.5" />
                Plan expires in {differenceInDays(new Date(item.end_date!), new Date())} days - Top up now!
              </div>
            )}

           <CardContent className="p-0">
              <div className="p-6 flex gap-5">
                 <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 relative shrink-0">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="w-full h-full object-contain" />
                    ) : <Package className="w-10 h-10 text-slate-200" />}
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg">
                       {item.quantity}
                    </div>
                 </div>
                 
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">#{item.id.slice(0, 8).toUpperCase()}</p>
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tight leading-tight">
                                                        {item.products?.name}
                                                    </h3>
                                                </div>
                                                <Badge className={cn(
                         "uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md border-none",
                         resolvedStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                         resolvedStatus === 'paused' ? 'bg-amber-100 text-amber-700' :
                         resolvedStatus === 'EXPIRED' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                         'bg-rose-100 text-rose-700'
                       )}>
                         {resolvedStatus}
                       </Badge>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                       <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.plan_type}
                       </p>
                       <span className="text-slate-200">•</span>
                       <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.delivery_time}
                       </p>
                       <span className="text-slate-200">•</span>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          {formatWeight(item.selected_weight || 1000, item.unit_type || 'ml')}
                       </p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 pt-2 truncate max-w-xs">
                       <MapPin className="w-3 h-3 shrink-0" /> {item.subscriptions?.address}
                    </p>
                 </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 grid grid-cols-2 gap-4 border-y border-slate-100">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">Next Scheduled Delivery</p>
                    <p className={cn(
                        "font-black tracking-tight leading-none text-xs",
                        expired ? "text-slate-300 line-through" : "text-slate-800"
                    )}>
                       {item.status !== 'cancelled' ? format(new Date(item.next_delivery_date), "dd MMMM, yyyy") : 'Ended'}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">Valid Until</p>
                    <p className={cn(
                        "font-black tracking-tight leading-none text-xs",
                        expiring ? "text-amber-600" : expired ? "text-rose-600" : "text-slate-800"
                    )}>
                       {item.end_date ? format(new Date(item.end_date), "dd MMMM, yyyy") : "Until Canceled"}
                    </p>
                 </div>
              </div>

              <div className="p-4 flex gap-2">
                 {resolvedStatus !== 'cancelled' && resolvedStatus !== 'EXPIRED' ? (
                   <>
                     <Button 
                       variant="outline"
                       className={cn(
                          "flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all active:scale-95",
                          item.status === 'active' ? "border-amber-100 text-amber-600 hover:bg-amber-50" : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                       )}
                       onClick={() => toggleStatus(item.id, item.status)}
                       disabled={!!processingId}
                     >
                        {processingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          item.status === 'active' ? <><PowerOff className="w-3.5 h-3.5 mr-2" /> Pause</> : <><Power className="w-3.5 h-3.5 mr-2" /> Resume</>
                        )}
                     </Button>
                     <Button 
                       variant="outline"
                       className="w-12 h-12 rounded-2xl border-2 border-rose-50 text-rose-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 flex items-center justify-center shrink-0"
                       onClick={() => cancelSubscription(item.id)}
                       disabled={!!processingId}
                     >
                        {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                     </Button>
                   </>
                 ) : (
                    <Button 
                       className={cn(
                           "w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95",
                           resolvedStatus === 'EXPIRED' ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" : "bg-slate-900 text-white"
                       )}
                       onClick={() => window.location.href = '/subscriptions'}
                    >
                       {resolvedStatus === 'EXPIRED' ? "Renew Subscription" : "Re-subscribe Product"}
                    </Button>
                 )}
              </div>
           </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
