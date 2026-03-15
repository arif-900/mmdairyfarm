import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarHeart, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SubscriptionItem {
    id: string;
    product_id: string;
    quantity: number;
    frequency: string;
    start_date: string;
    status: string;
    delivery_address: string;
    created_at: string;
    profiles: { full_name: string; phone: string } | null;
    products: { name: string } | null;
}

export function SubscriptionsTab() {
    const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchSubscriptions();

        // Subscribe to realtime updates
        const channel = supabase
            .channel("admin-subscriptions")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "subscriptions",
                },
                (payload) => {
                    console.log("Realtime subscription update:", payload);
                    fetchSubscriptions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setIsLoading(true);
            const { data: subsData, error: subsError } = await (supabase as any)
                .from("subscriptions")
                .select("id, user_id, product_id, quantity, frequency, start_date, status, delivery_address, created_at")
                .order("created_at", { ascending: false });

            if (subsError) throw subsError;

            const subscriptions = subsData || [];

            if (subscriptions.length > 0) {
                // Fetch profiles manually
                const userIds = [...new Set(subscriptions.map((s: any) => s.user_id).filter(Boolean))];
                let profilesMap: Record<string, any> = {};
                if (userIds.length > 0) {
                    const { data: profilesData } = await (supabase as any)
                        .from("profiles")
                        .select("id, full_name, phone")
                        .in("id", userIds);

                    if (profilesData) {
                        profilesMap = profilesData.reduce((acc: any, profile: any) => {
                            acc[profile.id] = profile;
                            return acc;
                        }, {});
                    }
                }

                // Fetch products manually
                const productIds = [...new Set(subscriptions.map((s: any) => s.product_id).filter(Boolean))];
                let productsMap: Record<string, any> = {};
                if (productIds.length > 0) {
                    const { data: productsData } = await (supabase as any)
                        .from("products")
                        .select("id, name")
                        .in("id", productIds);

                    if (productsData) {
                        productsMap = productsData.reduce((acc: any, product: any) => {
                            acc[product.id] = product;
                            return acc;
                        }, {});
                    }
                }

                // Merge Data
                const mergedData = subscriptions.map((sub: any) => ({
                    ...sub,
                    profiles: sub.user_id ? profilesMap[sub.user_id] || null : null,
                    products: sub.product_id ? productsMap[sub.product_id] || null : null,
                }));

                setSubscriptionsList(mergedData);
            } else {
                setSubscriptionsList([]);
            }
        } catch (error: any) {
            console.error("Error fetching subscriptions:", error);
            toast({
                title: "Failed to load subscriptions",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "active" ? "paused" : "active";
            const { error } = await (supabase as any)
                .from("subscriptions")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;

            fetchSubscriptions();
            toast({ title: `Subscription \${newStatus}` });
        } catch (error: any) {
            toast({
                title: "Error updating status",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CalendarHeart className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-gray-800">Active Subscriptions</h3>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : subscriptionsList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <CalendarHeart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>No active subscriptions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Delivery Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptionsList.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            {item.profiles ? (
                                                <div>
                                                    <p className="font-medium text-foreground">{item.profiles.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.profiles.phone}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Unknown Customer</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-foreground">{item.products?.name || 'Unknown'}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} / {item.frequency}</p>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {format(new Date(item.start_date), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm truncate max-w-[200px]" title={item.delivery_address}>{item.delivery_address}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold \${
                          item.status === 'active' ? 'bg-green-100 text-green-700' : 
                          item.status === 'paused' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'
                      }`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleStatus(item.id, item.status)}
                                                title={item.status === 'active' ? "Pause Subscription" : "Resume Subscription"}
                                            >
                                                {item.status === 'active' ? <PowerOff className="h-4 w-4 mr-1 text-orange-500" /> : <Power className="h-4 w-4 mr-1 text-green-500" />}
                                                {item.status === 'active' ? "Pause" : "Resume"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
