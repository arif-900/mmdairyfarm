import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/data/products";

export const PRODUCTS_QUERY_KEY = ["products"];

// Default product image fallbacks
import cowMilkImg from "@/assets/cow-milk.webp";
import buffaloMilkImg from "@/assets/buffalo-milk.webp";
import curdImg from "@/assets/curd.webp";
import gheeImg from "@/assets/ghee.webp";

const imageFallbacks: Record<string, string> = {
  "Milk Kova": cowMilkImg,
  "Buffalo Milk": buffaloMilkImg,
  "Fresh Curd (Dahi)": curdImg,
  "Pure Desi Ghee": gheeImg,
};

export function useProductsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, base_price_per_kg, unit, image_url, stock, is_active, available_weights, unit_type, delivery_days, original_price, background_gif")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching products query:", error);
        throw error;
      }

      return (data || []).map((prod: any) => ({
        id: prod.id,
        name: prod.name,
        description: prod.description || "Handcrafted with fresh ingredients from our farm.",
        price: Number(prod.price),
        basePricePerKg: prod.base_price_per_kg ? Number(prod.base_price_per_kg) : Number(prod.price),
        unit: prod.unit,
        image: prod.image_url || imageFallbacks[prod.name] || cowMilkImg,
        stock: prod.stock,
        is_active: prod.is_active,
        availableWeights: prod.available_weights || [1000],
        unitType: (prod.unit_type as "g" | "ml") || "g",
        tags: prod.tags || [],
        rating: prod.rating || 4.5,
        reviewCount: prod.review_count || 10,
        deliveryDays: prod.delivery_days ?? 0,
        originalPrice: prod.original_price ? Number(prod.original_price) : undefined,
        backgroundGif: prod.background_gif || null,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes stale time for price/stock balance
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache retention
    refetchOnWindowFocus: true, // Revalidate in background when customer returns to tab/PWA
    refetchOnMount: true,
  });

  // Realtime channel listener for instant synchronization on DB updates
  useEffect(() => {
    const channelName = `products-query-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      () => {
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    products: query.data || [],
    loading: query.isLoading,
    ...query,
  };
}
