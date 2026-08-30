import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/data/products";

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

export const INFINITE_PRODUCTS_PAGE_SIZE = 12;

interface UseInfiniteProductsParams {
  searchQuery?: string;
  categoryId?: string;
}

export function useInfiniteProductsQuery({ searchQuery = "", categoryId = "" }: UseInfiniteProductsParams = {}) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["infinite_products", { searchQuery, categoryId }],
    queryFn: async ({ pageParam = 0 }): Promise<{ products: Product[]; nextCursor: number | null; totalCount: number }> => {
      const from = pageParam * INFINITE_PRODUCTS_PAGE_SIZE;
      const to = from + INFINITE_PRODUCTS_PAGE_SIZE - 1;

      let dbQuery = supabase
        .from("products")
        .select(
          "id, name, description, price, base_price_per_kg, unit, image_url, stock, is_active, available_weights, unit_type, delivery_days, original_price, background_gif",
          { count: "exact" }
        )
        .eq("is_active", true);

      if (categoryId) {
        dbQuery = dbQuery.eq("category_id", categoryId);
      }

      const trimmedSearch = searchQuery.trim();
      if (trimmedSearch) {
        dbQuery = dbQuery.or(`name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%`);
      }

      const { data, error, count } = await dbQuery
        .order("name")
        .range(from, to);

      if (error) {
        console.error("Error in useInfiniteProductsQuery:", error);
        throw error;
      }

      const products: Product[] = (data || []).map((prod: any) => ({
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
        deliveryDays: prod.delivery_days ?? 0,
        originalPrice: prod.original_price ? Number(prod.original_price) : undefined,
        backgroundGif: prod.background_gif || null,
      }));

      const totalCount = count || 0;
      const hasMore = (pageParam + 1) * INFINITE_PRODUCTS_PAGE_SIZE < totalCount;
      const nextCursor = hasMore ? pageParam + 1 : null;

      return { products, nextCursor, totalCount };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: true,
  });

  // Real-time channel listener for instant sync on DB updates
  useEffect(() => {
    const channelName = `infinite-products-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["infinite_products"] });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const allProducts = query.data?.pages.flatMap((page) => page.products) || [];
  const totalCount = query.data?.pages[0]?.totalCount || allProducts.length;

  return {
    products: allProducts,
    totalCount,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    ...query,
  };
}
