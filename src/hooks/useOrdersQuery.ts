import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ORDERS_QUERY_KEY = ["user_orders"];

export function useOrdersQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...ORDERS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, expected_delivery_date, delivery_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user orders:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!userId,
    staleTime: 0, // Always revalidate on order page visit/focus for accurate status
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
  });

  // Real-time status update channel listener
  useEffect(() => {
    if (!userId) return;

    const channelName = `user-orders-sync-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    orders: query.data || [],
    loading: query.isLoading,
    ...query,
  };
}
