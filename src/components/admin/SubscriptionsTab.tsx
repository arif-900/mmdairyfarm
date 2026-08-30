import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CalendarHeart, 
  Power, 
  Filter, 
  RefreshCw, 
  BarChart, 
  Bike, 
  CheckCircle2, 
  User, 
  Eye, 
  MapPin, 
  Clock, 
  AlertCircle,
  Truck,
  CreditCard,
  Calendar,
  Trash2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWeight } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionItem {
    id: string;
    subscription_id: string;
    product_id: string;
    quantity: number;
    selected_weight: number | null;
    unit_type: string | null;
    plan_type: string;
    start_date: string;
    end_date: string | null;
    next_delivery_date: string | null;
    status: string;
    price_per_unit: number;
    payment_status: string;
    created_at: string;
    assigned_rider_id: string | null;
    subscriptions: {
       address: string;
       user_id: string;
    } | null;
    profiles: { full_name: string; phone: string } | null;
    products: { name: string; image_url?: string } | null;
    assigned_rider?: { full_name: string } | null;
}

interface Rider {
    user_id: string;
    full_name: string;
}

interface Delivery {
    id: string;
    delivery_date: string;
    status: string;
    notes: string | null;
}

export function SubscriptionsTab() {
    const [itemsList, setItemsList] = useState<SubscriptionItem[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const { toast } = useToast();

    // Dialog state
    const [selectedItem, setSelectedItem] = useState<SubscriptionItem | null>(null);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [isFetchingDeliveries, setIsFetchingDeliveries] = useState(false);

    const fetchSubscriptions = async () => {
        try {
            setIsLoading(true);
            
            // 1. Fetch Riders First
            const { data: rolesData } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "delivery_boy" as any);
            
            const riderIds = rolesData?.map(r => r.user_id) || [];
            if (riderIds.length > 0) {
                const { data: riderProfiles } = await supabase
                    .from("profiles")
                    .select("user_id, full_name")
                    .in("user_id", riderIds);
                setRiders(riderProfiles || []);
            }

            // 2. Fetch Subscriptions
            const { data: subsData, error: subsError } = await supabase
                .from("subscription_items")
                .select(`
                   id, subscription_id, product_id, quantity, selected_weight, unit_type, plan_type, start_date, end_date, next_delivery_date, status, price_per_unit, payment_status, created_at, assigned_rider_id,
                   subscriptions ( address, user_id ),
                   products ( name, image_url )
                `)
                .order("created_at", { ascending: false });

            if (subsError) throw subsError;

            const items = subsData || [];

            if (items.length > 0) {
                // Fetch profiles manually based on parent user_id
                const userIds = [...new Set(items.map((i: any) => i.subscriptions?.user_id).filter(Boolean))];
                let profilesMap: Record<string, any> = {};
                if (userIds.length > 0) {
                    const { data: profilesData } = await supabase
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

                // Merge Data
                const mergedData = items.map((sub: any) => {
                    const rider = riders.find(r => r.user_id === sub.assigned_rider_id);
                    return {
                        ...sub,
                        profiles: sub.subscriptions?.user_id ? profilesMap[sub.subscriptions.user_id] || null : null,
                        assigned_rider: rider || null
                    };
                });

                setItemsList(mergedData as any);
            } else {
                setItemsList([]);
            }
        } catch (error: any) {
            console.error("DEBUG: Subscriptions Tab Error:", error);
            toast({
                title: "Failed to load subscriptions",
                description: error.message || "Unknown schema error",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDeliveries = async (itemId: string) => {
        try {
            setIsFetchingDeliveries(true);
            const { data, error } = await supabase
                .from("deliveries")
                .select("*")
                .eq("subscription_item_id", itemId)
                .order("delivery_date", { ascending: false })
                .limit(10);
            
            if (error) throw error;
            setDeliveries(data || []);
        } catch (error: any) {
            console.error("Error fetching deliveries:", error);
        } finally {
            setIsFetchingDeliveries(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            fetchDeliveries(selectedItem.id);
        }
    }, [selectedItem]);

    const handleAssignRider = async (itemId: string, riderId: string) => {
        try {
            const finalRiderId = riderId === "none" ? null : riderId;

            // 1. Update the parent subscription item
            const { error: subError } = await supabase
                .from("subscription_items")
                .update({ assigned_rider_id: finalRiderId })
                .eq("id", itemId);

            if (subError) throw subError;

            // 2. Synchronize existing pending deliveries for today and future
            const today = new Date().toISOString().split('T')[0];
            const { data: updateData, error: deliveryError } = await supabase
                .from("deliveries")
                .update({ delivery_boy_id: finalRiderId })
                .eq("subscription_item_id", itemId)
                .eq("status", "pending")
                .gte("delivery_date", today)
                .select(); // Added .select() to see what was updated



            if (deliveryError) {
                console.error("Error syncing deliveries:", deliveryError);
                // We don't throw here to avoid blocking the main assignment, but it's good to log
            }

            toast({ title: "Rider Assigned & Synced", description: "Future deliveries updated successfully." });
            fetchSubscriptions();
        } catch (error: any) {
            toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleCancelSubscription = async (itemId: string) => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this subscription and refund the remaining balance (in Reward Coins, 4 Coins = ₹1) to the customer's wallet?"
        );
        if (!confirmCancel) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc("refund_subscription_to_wallet", {
                p_item_id: itemId
            });

            if (error) throw error;
            
            const result = data as any;
            if (!result.success) throw new Error(result.message);

            const coinsCredited = result.coins_credited || Math.floor((result.refunded_amount || 0) * 4);

            toast({
                title: "Subscription Cancelled",
                description: `₹${result.refunded_amount} (${coinsCredited} Reward Coins) was successfully credited to the customer's wallet for ${result.remaining_deliveries} unused deliveries.`,
            });
            fetchSubscriptions();
            setSelectedItem(null);
        } catch (err: any) {
            console.error("Cancel Error:", err);
            toast({
                title: "Cancellation Failed",
                description: err.message || "Could not process the cancellation refund.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "active" ? "paused" : "active";
            const { error } = await supabase
                .from("subscription_items")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;
            fetchSubscriptions();
            toast({ title: `Subscription Item ${newStatus}` });
        } catch (error: any) {
            toast({ title: "Error updating status", description: error.message, variant: "destructive" });
        }
    };

    const handleSyncTodayDrops = async () => {
        try {
            setIsLoading(true);
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Fetch ALL active items
            const { data: items, error: fetchError } = await supabase
                .from("subscription_items")
                .select("*")
                .eq("status", "active");

            if (fetchError) throw fetchError;
            if (!items || items.length === 0) {
                toast({ title: "No Active Subscriptions", description: "You need active subscribers to sync a route." });
                return;
            }

            // 2. Fetch ALL deliveries for today to avoid duplicates
            const { data: existingDeliveries } = await supabase
                .from("deliveries")
                .select("subscription_item_id, delivery_slot")
                .eq("delivery_date", today);

            const existingMap = new Set(existingDeliveries?.map(d => `${d.subscription_item_id}-${d.delivery_slot}`) || []);

            const newDeliveries: any[] = [];
            const updates: any[] = [];

            for (const item of items) {
                // Safeguard against expired
                if (item.end_date && item.end_date < today) {
                    updates.push({ id: item.id, status: 'cancelled' });
                    
                    // Clean up any stray pending deliveries for this expired subscription
                    const { error: cleanupError } = await supabase
                        .from("deliveries")
                        .update({ status: 'skipped', notes: 'Subscription Period Ended' })
                        .eq("subscription_item_id", item.id)
                        .eq("status", "pending");
                        
                    if (cleanupError) console.error("Cleanup error:", cleanupError);
                    continue;
                }

                // Handle 'both' slots vs single slot
                const slots = item.delivery_time === 'both' ? ['morning', 'evening'] : [item.delivery_time];
                let createdAny = false;

                slots.forEach(slot => {
                    const key = `${item.id}-${slot}`;
                    if (!existingMap.has(key)) {
                        newDeliveries.push({
                            subscription_item_id: item.id,
                            delivery_date: today,
                            status: 'pending',
                            delivery_slot: slot,
                            is_subscription: true,
                            delivery_boy_id: item.assigned_rider_id
                        });
                        createdAny = true;
                    }
                });

                // ONLY update next_delivery_date if it was actually today or in the past
                // OR if we just created today's missing drop and the date was today.
                if (createdAny || item.next_delivery_date <= today) {
                    const nextDate = new Date(today);
                    if (item.plan_type === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                    else if (item.plan_type === 'alternate') nextDate.setDate(nextDate.getDate() + 2);
                    else if (item.plan_type === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                    else if (item.plan_type === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                    else nextDate.setDate(nextDate.getDate() + 1);

                    updates.push({
                        id: item.id,
                        next_delivery_date: nextDate.toISOString().split('T')[0]
                    });
                }
            }

            // 2. Perform DB operations
            if (newDeliveries.length > 0) {
                const { error: insError } = await supabase.from("deliveries").insert(newDeliveries);
                if (insError) throw insError;
            }

            if (updates.length > 0) {
                // Use individual updates to avoid upsert issues with NOT NULL columns like 'quantity'
                for (const update of updates) {
                    const { error: upsError } = await supabase
                        .from("subscription_items")
                        .update({ next_delivery_date: update.next_delivery_date })
                        .eq("id", update.id);
                    
                    if (upsError) {
                        console.error(`Failed to update item ${update.id}:`, upsError);
                    }
                }
            }

            if (newDeliveries.length === 0) {
                toast({ title: "Already Synced", description: "All drops for today are already in the database." });
            } else {
                toast({ 
                    title: "Sync Successful!", 
                    description: `Generated ${newDeliveries.length} missing drops for today.` 
                });
            }
            fetchSubscriptions();

        } catch (error: any) {
            console.error("Sync Error:", error);
            toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    const isExpiringSoon = (endDate: string | null) => {
        if (!endDate) return false;
        const days = differenceInDays(new Date(endDate), new Date());
        return days >= 0 && days <= 3;
    };

    const filtered = statusFilter === 'all' ? itemsList : itemsList.filter(s => s.status === statusFilter);

    // Stats
    const total = itemsList.length;
    const active = itemsList.filter(s => s.status === 'active').length;
    const unassigned = itemsList.filter(s => s.status === 'active' && !s.assigned_rider_id).length;
    const expiring = itemsList.filter(s => s.status === 'active' && isExpiringSoon(s.end_date)).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
               <Card className="bg-[#0B2118] border border-white/10 shadow-xl rounded-2xl overflow-hidden relative">
                   <CardContent className="p-4 flex items-center gap-3 relative z-10">
                       <div className="w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center shadow-sm">
                           <CalendarHeart className="w-5 h-5 text-[#C98A24]" />
                       </div>
                       <div>
                           <p className="text-[9px] text-[#AAB8B0] font-black uppercase tracking-widest leading-none mb-1">Total Plans</p>
                           <p className="text-xl font-black text-[#F5F3EC] leading-none">{total}</p>
                       </div>
                   </CardContent>
               </Card>
               <Card className="bg-[#0B2118] border border-white/10 shadow-xl rounded-2xl overflow-hidden relative">
                   <CardContent className="p-4 flex items-center gap-3 relative z-10">
                       <div className="w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center shadow-sm">
                           <Power className="w-5 h-5 text-[#3BC77B]" />
                       </div>
                       <div>
                           <p className="text-[9px] text-[#AAB8B0] font-black uppercase tracking-widest leading-none mb-1">Active</p>
                           <p className="text-xl font-black text-[#3BC77B] leading-none">{active}</p>
                       </div>
                   </CardContent>
               </Card>
               <Card className={cn(
                   "shadow-xl rounded-2xl overflow-hidden relative bg-[#0B2118] border border-white/10",
                   unassigned > 0 && "border-rose-500/40 bg-rose-950/20"
               )}>
                   <CardContent className="p-4 flex items-center gap-3 relative z-10">
                       <div className={cn(
                           "w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center shadow-sm",
                           unassigned > 0 && "border-rose-500/30"
                       )}>
                           <Bike className={cn("w-5 h-5", unassigned > 0 ? "text-rose-400" : "text-[#3BC77B]")} />
                       </div>
                       <div>
                           <p className="text-[9px] text-[#AAB8B0] font-black uppercase tracking-widest leading-none mb-1">Missing Rider</p>
                           <p className={cn("text-xl font-black leading-none", unassigned > 0 ? "text-rose-400" : "text-[#3BC77B]")}>
                               {unassigned}
                           </p>
                       </div>
                   </CardContent>
               </Card>
               <Card className={cn(
                   "shadow-xl rounded-2xl overflow-hidden relative bg-[#0B2118] border border-white/10",
                   expiring > 0 && "border-amber-500/40 bg-amber-950/20"
               )}>
                   <CardContent className="p-4 flex items-center gap-3 relative z-10">
                       <div className={cn(
                           "w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center shadow-sm",
                           expiring > 0 && "border-amber-500/30"
                       )}>
                           <AlertCircle className={cn("w-5 h-5", expiring > 0 ? "text-amber-400" : "text-[#AAB8B0]")} />
                       </div>
                       <div>
                           <p className="text-[9px] text-[#AAB8B0] font-black uppercase tracking-widest leading-none mb-1">Expiring Soon</p>
                           <p className={cn("text-xl font-black leading-none", expiring > 0 ? "text-amber-400" : "text-[#AAB8B0]")}>
                               {expiring}
                           </p>
                       </div>
                   </CardContent>
               </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#0B2118] p-4 rounded-2xl border border-white/10 shadow-xl">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] h-11 rounded-xl bg-[#10291F] border-white/10 font-bold uppercase text-[10px] tracking-widest text-[#F5F3EC]">
                        <Filter className="w-3 h-3 mr-2 text-[#C98A24]" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[#10291F] border-white/10 text-[#F5F3EC]">
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button 
                    variant="outline" 
                    onClick={handleSyncTodayDrops} 
                    disabled={isLoading} 
                    className="h-11 rounded-xl px-6 border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-[#3BC77B] hover:text-[#061A13] transition-all font-black uppercase text-[10px] tracking-widest gap-2"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    Generate Today's Route
                </Button>

                <Button 
                    variant="outline" 
                    onClick={fetchSubscriptions} 
                    disabled={isLoading} 
                    className="h-11 rounded-xl px-6 border-white/10 bg-[#10291F] text-[#F5F3EC] hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    Refresh List
                </Button>
            </div>

            <div className="bg-[#0B2118] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 flex justify-center text-[#C98A24]">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center text-[#AAB8B0]">
                        <CalendarHeart className="h-16 w-16 mx-auto opacity-20 mb-4 text-[#C98A24]" />
                        <p className="font-black uppercase text-xs tracking-widest text-[#AAB8B0]">No matching subscriptions</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#10291F] border-b border-white/10">
                                <TableRow className="hover:bg-transparent border-white/10">
                                    <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-[#AAB8B0]">Customer & Product</TableHead>
                                    <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-[#AAB8B0]">Shipment Details</TableHead>
                                    <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-[#AAB8B0]">Assigned Rider</TableHead>
                                    <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-[#AAB8B0]">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-[#AAB8B0] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((item) => {
                                    const expiring = isExpiringSoon(item.end_date) && item.status === 'active';
                                    return (
                                        <TableRow key={item.id} className="hover:bg-white/5 transition-colors border-b border-white/10 last:border-0 group text-[#F5F3EC]">
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                   <div className="w-10 h-10 rounded-full bg-[#10291F] flex items-center justify-center shrink-0 border border-white/10">
                                                      <User className="w-5 h-5 text-[#C98A24]" />
                                                   </div>
                                                   <div className="space-y-0.5">
                                                      <p className="text-[9px] font-black text-[#C98A24] uppercase tracking-widest leading-none">#{item.id.slice(0, 8).toUpperCase()}</p>
                                                      <div className="flex items-center gap-2">
                                                        <p className="font-black text-[#F5F3EC] uppercase tracking-tight leading-tight">{item.profiles?.full_name || "Unknown"}</p>
                                                        {expiring && (
                                                            <Badge className="bg-amber-950/60 text-amber-300 border-amber-500/30 text-[8px] font-black uppercase px-2 py-0 h-4">Expires Soon</Badge>
                                                        )}
                                                      </div>
                                                      <p className="text-[10px] font-black text-[#3BC77B] uppercase tracking-widest">{item.products?.name}</p>
                                                   </div>
                                                </div>
                                            </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.quantity} Units · {formatWeight(item.selected_weight || 1000, (item.unit_type as any) || 'ml')}</p>
                                                <Badge variant="secondary" className="bg-slate-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                                    {item.plan_type}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Select 
                                              value={item.assigned_rider_id || "none"} 
                                              onValueChange={(val) => handleAssignRider(item.id, val)}
                                            >
                                              <SelectTrigger className={cn(
                                                  "h-10 w-[180px] rounded-[10px] border-dashed font-bold text-[11px] uppercase tracking-wider transition-all",
                                                  item.assigned_rider_id ? "bg-emerald-50/50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"
                                              )}>
                                                  <div className="flex items-center gap-2">
                                                     {item.assigned_rider_id ? <CheckCircle2 className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                                                     <SelectValue placeholder="Assign Rider" />
                                                  </div>
                                              </SelectTrigger>
                                              <SelectContent className="rounded-[10px] shadow-2xl border-slate-100">
                                                  <SelectItem value="none" className="text-slate-400 font-bold uppercase text-[10px]">-- Unassigned --</SelectItem>
                                                  {riders.map(rider => (
                                                      <SelectItem key={rider.user_id} value={rider.user_id} className="font-black uppercase text-[10px] tracking-widest">
                                                          {rider.full_name}
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Badge className={cn(
                                                "uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-[10px] border-none",
                                                item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                                item.status === 'paused' ? 'bg-amber-100 text-amber-700' : 
                                                item.status === 'cancelled' || isBefore(new Date(item.end_date || ''), new Date()) ? 'bg-rose-100 text-rose-700' :
                                                'bg-slate-100 text-slate-500'
                                            )}>
                                                {isBefore(new Date(item.end_date || ''), new Date()) ? 'EXPIRED' : item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => setSelectedItem(item)}
                                                className="h-9 w-9 p-0 rounded-[10px] bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>

                                            {item.status !== 'cancelled' && (
                                              <Button 
                                                  variant="outline" 
                                                  size="sm" 
                                                  onClick={() => handleToggleStatus(item.id, item.status)}
                                                  className={cn(
                                                     "h-9 px-4 rounded-[10px] font-black uppercase text-[10px] tracking-widest transition-all",
                                                     item.status === 'active' ? 'text-amber-600 border-amber-100 hover:bg-amber-50' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                                  )}
                                              >
                                                  {item.status === 'active' ? 'Pause' : 'Resume'}
                                              </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* --- DETAILS DIALOG --- */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-md rounded-[28px] p-0 overflow-hidden border-none shadow-2xl">
                    {selectedItem && (
                        <div className="flex flex-col">
                            <div className="bg-emerald-950 p-5 text-white relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                <DialogHeader>
                                    <div className="flex items-center gap-4 mb-1">
                                        <div className="w-16 h-16 bg-white/10 rounded-[10px] p-2 border border-white/10 backdrop-blur-sm shrink-0">
                                            <img src={selectedItem.products?.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-black uppercase tracking-tighter mb-0.5">{selectedItem.products?.name}</DialogTitle>
                                            <div className="flex items-center gap-2">
                                                 <Badge className="bg-emerald-500 text-slate-950 font-black uppercase text-[8px] tracking-widest border-none h-4 px-1.5 leading-none">
                                                    {selectedItem.status}
                                                 </Badge>
                                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">#{selectedItem.id.slice(0,8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="p-4 space-y-4 bg-slate-50/50">
                                {/* Timeline section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <div className="p-3 bg-white rounded-[10px] border border-slate-100 shadow-sm">
                                            <Label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-0.5">
                                                <User className="w-2.5 h-2.5" /> Customer
                                            </Label>
                                            <div className="space-y-0">
                                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{selectedItem.profiles?.full_name}</p>
                                                <p className="text-[9px] font-bold text-emerald-600 leading-none">{selectedItem.profiles?.phone}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-[10px] border border-slate-100 shadow-sm">
                                            <Label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-0.5">
                                                <MapPin className="w-2.5 h-2.5" /> Deliver To
                                            </Label>
                                            <p className="text-[9px] font-bold text-slate-600 leading-tight italic">
                                                {selectedItem.subscriptions?.address}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="p-3 bg-white rounded-[10px] border border-slate-100 shadow-sm">
                                            <Label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-0.5">
                                                <Clock className="w-2.5 h-2.5" /> Schedule
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-[7px] font-bold text-slate-400 uppercase">Cycle</p>
                                                    <p className="text-[9px] font-black text-slate-800 capitalize leading-none">{selectedItem.plan_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[7px] font-bold text-slate-400 uppercase">Qty</p>
                                                    <p className="text-[9px] font-black text-slate-800 leading-none">{selectedItem.quantity}x</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-[10px] border border-slate-100 shadow-sm relative overflow-hidden">
                                            {isExpiringSoon(selectedItem.end_date) && (
                                                <div className="absolute top-0 right-0 py-0.5 px-2 bg-amber-500 text-white font-black text-[7px] uppercase tracking-widest rounded-bl-lg">Soon</div>
                                            )}
                                            <Label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-0.5">
                                                <Calendar className="w-2.5 h-2.5" /> Expiration
                                            </Label>
                                            <p className={cn(
                                                "text-[10px] font-black",
                                                isExpiringSoon(selectedItem.end_date) ? "text-amber-600" : "text-slate-800"
                                            )}>
                                                {selectedItem.end_date ? format(new Date(selectedItem.end_date), "dd MMM yyyy") : "No End Date"}
                                            </p>
                                        </div>
                                    </div>
                                </div>


                                {/* Delivery History (Drops) */}
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Recent History</h4>
                                        {isFetchingDeliveries && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />}
                                    </div>

                                    {deliveries.length === 0 ? (
                                        <div className="py-4 text-center text-slate-300 italic border border-dashed border-slate-100 rounded-[10px]">
                                            <p className="text-[8px] font-bold uppercase">No drops recorded</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 overflow-y-auto max-h-[120px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                            {deliveries.map(drop => (
                                                <div key={drop.id} className="flex items-center justify-between p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            drop.status === 'delivered' ? "bg-emerald-500 shadow-lg" : "bg-slate-300"
                                                        )} />
                                                        <p className="text-[9px] font-black text-slate-800">{format(new Date(drop.delivery_date), "eee, d MMM")}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge className={cn(
                                                            "text-[7px] font-black uppercase border-none px-1.5 h-4 rounded-sm flex items-center justify-center",
                                                            drop.status === 'delivered' ? "bg-emerald-100 text-emerald-700" : 
                                                            drop.status === 'skipped' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {drop.status}
                                                        </Badge>
                                                        {drop.notes && (
                                                            <p className="text-[7px] font-bold text-slate-400 italic bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100">
                                                                "{drop.notes}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center gap-2">
                                {selectedItem.status !== 'cancelled' && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleCancelSubscription(selectedItem.id)}
                                        disabled={isLoading}
                                        className="h-8 px-4 rounded-[10px] border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase text-[8px] tracking-widest active:scale-95 transition-all gap-1.5"
                                    >
                                        <Trash2 className="w-2.5 h-2.5" /> Refund & Cancel
                                    </Button>
                                )}
                                <Button onClick={() => setSelectedItem(null)} className="h-8 px-6 rounded-[10px] bg-emerald-950 hover:bg-emerald-900 text-white font-black uppercase text-[8px] tracking-widest active:scale-95 transition-all">
                                    Close Panel
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
