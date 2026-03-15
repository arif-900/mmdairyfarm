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
  price: string | number;
  unit: string;
  image?: string; // from DB or fallback
  stock?: number;
  is_active?: boolean;
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
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        // Map the DB products and attach exact fallback images if they don't have a URL configured yet
        const mappedProducts = data?.map(dbProd => ({
          id: dbProd.id,
          name: dbProd.name,
          description: dbProd.description || "",
          price: dbProd.price,
          unit: dbProd.unit,
          image: dbProd.image_url || imageFallbacks[dbProd.name] || cowMilkImg,
          stock: dbProd.stock,
          is_active: dbProd.is_active
        })) || [];

        setDbProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to load live products from DB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Subscribe to real-time database changes on the products table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Real-time product change detected!', payload);
          // Refetch to cleanly apply sorting, active filters, and image fallbacks
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products: dbProducts, loading };
};
