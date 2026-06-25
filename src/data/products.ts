import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import cowMilkImg from "@/assets/cow-milk.jpg";
import buffaloMilkImg from "@/assets/buffalo-milk.jpg";
import curdImg from "@/assets/curd.jpg";
import gheeImg from "@/assets/ghee.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; 
  basePricePerKg?: number; 
  unit: string;
  image?: string;
  stock?: number;
  is_active?: boolean;
  availableWeights?: number[]; 
  unitType?: "g" | "ml";
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  deliveryDays?: number;
  originalPrice?: number;
  backgroundGif?: string;
}

// Fallbacks for the default demo products
const imageFallbacks: Record<string, string> = {
  "Milk Kova": cowMilkImg,
  "Buffalo Milk": buffaloMilkImg,
  "Fresh Curd (Dahi)": curdImg,
  "Pure Desi Ghee": gheeImg,
};

export const useStoreProducts = () => {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        // Map the DB products and attach exact fallback images
        const mappedProducts = (data || []).map((prod: any) => {
          return {
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
          };
        });

        setDbProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to load products from DB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products: dbProducts, loading };
};
