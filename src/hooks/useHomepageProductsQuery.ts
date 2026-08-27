import { useQuery } from "@tanstack/react-query";
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

export const HOMEPAGE_PRODUCTS_QUERY_KEY = ["homepage_products"];

export function useHomepageProductsQuery(limit = 4) {
  const query = useQuery({
    queryKey: [...HOMEPAGE_PRODUCTS_QUERY_KEY, limit],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, base_price_per_kg, unit, image_url, stock, is_active, unit_type, original_price")
        .eq("is_active", true)
        .order("name")
        .limit(limit);

      if (error) {
        console.error("Error fetching homepage products:", error);
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
        availableWeights: [1000],
        unitType: (prod.unit_type as "g" | "ml") || "g",
        originalPrice: prod.original_price ? Number(prod.original_price) : undefined,
      }));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: true,
  });

  return {
    products: query.data || [],
    loading: query.isLoading,
    ...query,
  };
}
