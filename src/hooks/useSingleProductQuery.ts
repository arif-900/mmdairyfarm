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

export function useSingleProductQuery(id?: string) {
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, base_price_per_kg, unit, image_url, stock, is_active, available_weights, unit_type, delivery_days, original_price, background_gif")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        console.error("Error fetching single product detail:", error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description || "Handcrafted with fresh ingredients from our farm.",
        price: Number(data.price),
        basePricePerKg: data.base_price_per_kg ? Number(data.base_price_per_kg) : Number(data.price),
        unit: data.unit,
        image: data.image_url || imageFallbacks[data.name] || cowMilkImg,
        stock: data.stock,
        is_active: data.is_active,
        availableWeights: data.available_weights || [1000],
        unitType: (data.unit_type as "g" | "ml") || "g",
        deliveryDays: data.delivery_days ?? 0,
        originalPrice: data.original_price ? Number(data.original_price) : undefined,
        backgroundGif: data.background_gif || null,
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: true,
  });

  return {
    product: query.data || null,
    loading: query.isLoading,
    error: query.error,
    ...query,
  };
}
