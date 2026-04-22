import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, MapPin, Truck, CheckCircle2, XCircle, Phone, Navigation, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { formatWeight } from "@/utils/pricing";
import { Input } from "@/components/ui/input";

export function SubscriptionsDeliveryList({ date, showAll = false }: { date?: Date, showAll?: boolean }) {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [skippingId, setSkippingId] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState("");
    const { toast } = useToast();

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const targetDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
            
            // 1. Fetch simplified deliveries first
            let query = supabase
                .from("deliveries")
                .select(`
                    id, subscription_item_id, delivery_date, status, notes, delivery_slot,
                    subscription_items (
                        quantity, selected_weight, unit_type, plan_type, delivery_time, status,
                        products (name, image_url),
                        subscriptions (
                            user_id,
                            address
                        )
                    )
                `)
                .eq("delivery_date", targetDate)
                .eq("is_subscription", true);

            if (!showAll && user) {
                query = query.eq("delivery_boy_id", user.id);
            }

            const { data: deliveryData, error: deliveryError } = await query;
            
            if (deliveryError) {
                console.error("Supabase Error:", deliveryError);
                throw deliveryError;
            }

            if (!deliveryData || deliveryData.length === 0) {
                setDeliveries([]);
                return;
            }

            // FILTER: Only show active subscription deliveries
            const activeDeliveries = deliveryData.filter((d: any) => 
                d.subscription_items && d.subscription_items.status === 'active'
            );

            if (activeDeliveries.length === 0) {
                setDeliveries([]);
                return;
            }

            // 2. Extract unique user IDs to fetch profiles
            const userIds = [...new Set(activeDeliveries.map((d: any) => d.subscription_items?.subscriptions?.user_id).filter(Boolean))];

            if (userIds.length > 0) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("user_id, full_name, phone")
                    .in("user_id", userIds);

                const profileMap = (profileData || []).reduce((acc: any, p: any) => {
                    acc[p.user_id] = p;
                    return acc;
                }, {});

                // Combine data
                const finalData = activeDeliveries.map((d: any) => ({
                    ...d,
                    customer: profileMap[d.subscription_items?.subscriptions?.user_id]
                }));

                setDeliveries(finalData);
            } else {
                setDeliveries(activeDeliveries);
            }

        } catch (error: any) {
            console.error("Fetch Error:", error);
            toast({ 
                title: "Failed to fetch route", 
                description: error.message || "A database join error occurred.",
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [date, user, showAll]);

    const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
        try {
            const { error } = await supabase
                .from("deliveries")
                .update({ 
                  status: newStatus,
                  notes: reason || null
                })
                .eq("id", id);
            
            if (error) throw error;

            // Auto-extend logic if skipped
            if (newStatus === 'skipped') {
                // 1. Get the item ID
                const currentDelivery = deliveries.find(d => d.id === id);
                const itemId = currentDelivery?.subscription_item_id;

                if (itemId) {
                    // 2. Fetch the current end_date
                    const { data: item } = await supabase
                        .from("subscription_items")
                        .select("end_date, delivery_time")
                        .eq("id", itemId)
                        .single();

                    // 3. Increment end_date ONLY if it's NOT a 'both' (Morning+Evening) plan
                    // This avoids giving a customer a full 2-slot extra day for skipping just 1 slot
                    if (item?.end_date && item?.delivery_time !== 'both') {
                        const newEndDate = addDays(new Date(item.end_date), 1);
                        const newEndDateStr = newEndDate.toISOString().split("T")[0];
                        
                        // 4. Update
                        const { error: extError } = await supabase
                            .from("subscription_items")
                            .update({ end_date: newEndDateStr })
                            .eq("id", itemId);

                        if (extError) {
                            console.error("Auto-Extension Error:", extError);
                            toast({ 
                                title: "Extension Failed", 
                                description: `The skip worked, but we couldn't extend the plan: ${extError.message}`,
                                variant: "destructive"
                            });
                        } else {
                            toast({ 
                                title: "Subscription Extended", 
                                description: `Because you skipped today, the plan has been extended by 1 day.` 
                            });
                        }
                    }
                }
            } else {
                toast({ title: `Marked as ${newStatus}` });
            }

            setSkippingId(null);
            setCustomReason("");
            fetchDeliveries();
        } catch (error: any) {
            console.error("Critical Update Error:", error);
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
    }

    if (deliveries.length === 0) {
        return (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center shadow-inner">
                <Truck className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Assigned Route</h3>
                <p className="text-slate-400 font-bold mt-2 mx-auto max-w-xs leading-tight uppercase italic text-[10px]">
                    {showAll ? "No subscription deliveries scheduled for this date." : "You haven't been assigned any subscription drops for this date."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                    Assigned Drops <span className="text-emerald-600 ml-1">({deliveries.length})</span>
                </h2>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl">
                        {deliveries.filter(d => (d.delivery_slot || d.subscription_items?.delivery_time) === 'morning').length} Morning
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl">
                        {deliveries.filter(d => (d.delivery_slot || d.subscription_items?.delivery_time) === 'evening').length} Evening
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deliveries.map((delivery) => {
                    const subItem = delivery.subscription_items;
                    const sub = subItem?.subscriptions;
                    const profile = delivery.customer_profile;

                    return (
                        <Card key={delivery.id} className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white group hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-100">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <Badge className="uppercase tracking-widest text-[9px] font-black bg-emerald-600 text-white hover:bg-emerald-600 border-none px-3 py-1 rounded-lg">
                                            SUBSCRIPTION (PREPAID)
                                        </Badge>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-emerald-100 text-emerald-700 bg-emerald-50/50">
                                            #{delivery.subscription_item_id.slice(0, 8).toUpperCase()}
                                        </Badge>
                                        <Badge className={cn(
                                            "uppercase tracking-widest text-[9px] font-black border-none px-3 py-1 rounded-lg",
                                            (delivery.delivery_slot || subItem?.delivery_time) === 'morning' ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                                        )}>
                                            {(delivery.delivery_slot || subItem?.delivery_time) || 'Morning'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex flex-col">
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2 pt-1">
                                                {profile?.full_name || "Customer"}
                                            </h3>
                                        </div>
                                        {profile?.phone && (
                                            <a href={`tel:${profile.phone}`} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                                                <Phone className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="bg-slate-50/50 rounded-3xl p-5 mb-6 border border-slate-100 flex items-center justify-between shadow-inner">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2">
                                                {subItem?.products?.image_url ? (
                                                    <img src={subItem.products.image_url} alt="" className="w-full h-full object-contain" />
                                                ) : <Package className="w-6 h-6 text-slate-200" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Product</p>
                                                <p className="font-black text-slate-800 leading-none text-lg tracking-tight">{subItem?.products?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Qty / Size</p>
                                            <div className="flex flex-col items-end">
                                               <p className="text-2xl font-black text-emerald-600 leading-none">{subItem?.quantity} Unit(s)</p>
                                               <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mt-1">
                                                  {formatWeight(subItem?.selected_weight || 1000, subItem?.unit_type || 'ml')}
                                               </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start px-2 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <MapPin className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-500 leading-tight">
                                                {sub?.address}
                                            </p>
                                            <Button 
                                                variant="link" 
                                                className="h-auto p-0 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:no-underline"
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sub?.address || '')}`, '_blank')}
                                            >
                                                <Navigation className="w-3 h-3" /> Get Directions
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        {delivery.status === 'pending' ? (
                                            skippingId === delivery.id ? (
                                                <div className="bg-rose-50/50 rounded-[32px] p-5 border-2 border-rose-100/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em]">Why skip this?</p>
                                                        <Button 
                                                            variant="ghost" 
                                                            className="h-6 w-6 p-0 hover:bg-rose-100 text-rose-400"
                                                            onClick={() => setSkippingId(null)}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        {['Customer Away', 'Shop Closed', 'No Response', 'Payment Due'].map(r => (
                                                            <Button 
                                                                key={r}
                                                                variant="outline"
                                                                className="h-11 rounded-2xl bg-white border-rose-100 text-rose-600 font-bold text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300"
                                                                onClick={() => handleUpdateStatus(delivery.id, 'skipped', r)}
                                                            >
                                                                {r}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    <div className="relative group">
                                                        <Input 
                                                            placeholder="Other reason..."
                                                            value={customReason}
                                                            onChange={(e) => setCustomReason(e.target.value)}
                                                            className="h-14 pl-5 pr-14 rounded-[20px] bg-white border-2 border-rose-100 text-rose-900 text-[11px] font-bold placeholder:text-rose-200 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all"
                                                        />
                                                        <Button 
                                                            className="absolute right-2 top-2 h-10 w-10 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:grayscale disabled:opacity-30"
                                                            onClick={() => handleUpdateStatus(delivery.id, 'skipped', customReason)}
                                                            disabled={!customReason}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Button 
                                                        className="h-16 rounded-[28px] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.15em] text-[10px] border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 shadow-xl shadow-emerald-500/20 transition-all"
                                                        onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Delivered
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        className="h-16 rounded-[28px] border-2 border-slate-100 text-slate-400 font-black uppercase tracking-[0.15em] text-[10px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                                                        onClick={() => setSkippingId(delivery.id)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" /> Skip Today
                                                    </Button>
                                                </div>
                                            )
                                        ) : (
                                            <Button 
                                                variant="outline"
                                                className={cn(
                                                    "w-full h-16 rounded-[28px] border-2 font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2",
                                                    delivery.status === 'delivered' ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
                                                )}
                                                onClick={() => handleUpdateStatus(delivery.id, 'pending')}
                                            >
                                                {delivery.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                Status: {delivery.status} (Undo)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
