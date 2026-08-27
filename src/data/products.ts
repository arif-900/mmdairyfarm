import { useProductsQuery } from "@/hooks/useProductsQuery";

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

export const useStoreProducts = () => {
  const { products, loading } = useProductsQuery();
  return { products, loading };
};
