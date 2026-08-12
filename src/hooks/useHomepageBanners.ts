import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PromoBannerItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export const PROMO_BANNERS_QUERY_KEY = ["homepage_banners"];
const LOCAL_STORAGE_KEY = "mm_cached_homepage_banners_v2";

/**
 * Fetch and cache homepage promotional banners with instant 0ms Stale-While-Revalidate support.
 */
export function useHomepageBanners() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROMO_BANNERS_QUERY_KEY,
    queryFn: async (): Promise<PromoBannerItem[]> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "homepage_banners")
        .maybeSingle();

      if (error) {
        console.error("Error fetching homepage_banners:", error);
        throw error;
      }

      if (data && data.value) {
        let parsed = data.value;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {}
        }

        if (Array.isArray(parsed)) {
          const sorted = parsed.sort(
            (a: PromoBannerItem, b: PromoBannerItem) =>
              (a.displayOrder || 0) - (b.displayOrder || 0)
          );
          // Persist to local storage for instant offline / return visits
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
          } catch (e) {}
          return sorted;
        }
      }
      return [];
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
      return undefined;
    },
    staleTime: 1000 * 60 * 15, // 15 Minutes Stale Time
    gcTime: 1000 * 60 * 60 * 24, // 24 Hours Garbage Collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Supabase Realtime channel for instant cross-tab and cross-device sync
  useEffect(() => {
    const channel = supabase
      .channel("homepage-banners-query-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.homepage_banners",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: PROMO_BANNERS_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const activeBanners = (query.data || []).filter(
    (item) => item && item.isActive && item.imageUrl
  );

  return {
    ...query,
    banners: query.data || [],
    activeBanners,
  };
}

/**
 * Optimistic mutation hook for Admin Dashboard banner operations (<1ms latency).
 */
export function useUpdateHomepageBanners() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBanners: PromoBannerItem[]) => {
      const payload = JSON.stringify(newBanners);
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "homepage_banners", value: payload }, { onConflict: "key" });

      if (error) throw error;
      return newBanners;
    },
    onMutate: async (newBanners) => {
      await queryClient.cancelQueries({ queryKey: PROMO_BANNERS_QUERY_KEY });
      const previousBanners = queryClient.getQueryData<PromoBannerItem[]>(PROMO_BANNERS_QUERY_KEY);

      // Optimistic cache update
      queryClient.setQueryData(PROMO_BANNERS_QUERY_KEY, newBanners);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newBanners));
      } catch (e) {}

      return { previousBanners };
    },
    onError: (err, newBanners, context) => {
      if (context?.previousBanners) {
        queryClient.setQueryData(PROMO_BANNERS_QUERY_KEY, context.previousBanners);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROMO_BANNERS_QUERY_KEY });
    },
  });
}
