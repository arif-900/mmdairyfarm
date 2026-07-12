import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";

interface ProductCardProps extends Product {}

const ProductCard = memo(function ProductCard(product: ProductCardProps) {
  const { id, name, description, price, basePricePerKg, image, stock, unitType, deliveryDays, originalPrice } = product;
  const navigate = useNavigate();
  
  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;
  const isOnSale = originalPrice && originalPrice > (basePricePerKg || Number(price));
  const discountPercent = isOnSale ? Math.round(((originalPrice - (basePricePerKg || Number(price))) / originalPrice) * 100) : 0;

  return (
    <div 
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "group bg-white rounded-[20px] p-6 pb-6 transition-transform duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-[6px] hover:scale-[1.02] border border-[#F1F5F9] cursor-pointer relative",
        isOutOfStock && "opacity-80 grayscale-[0.3]"
      )}
    >
      {/* Product Image Section (Approx 55% of visual layout space) */}
      <div className="relative aspect-[4/3] rounded-[16px] overflow-hidden mb-6 bg-[#FAFAFA] flex items-center justify-center border border-slate-50">
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-4/5 h-4/5 object-contain p-2 transition-transform duration-500 group-hover:scale-110"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-full shadow-sm text-xs tracking-wider uppercase">
              Sold Out
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-amber-500 text-white font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider shadow-sm border border-white/20">
              Only {stock} Left!
            </span>
          </div>
        )}

        {isOnSale && !isOutOfStock && (
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-red-500 text-white font-bold px-2.5 py-1 rounded-full shadow-sm text-[9px] uppercase tracking-wider border border-white/10">
              Save {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        <div className="space-y-1.5 text-center">
          <h3 className="font-sans text-lg font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          
          {/* Price Display */}
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-xl font-bold text-slate-900">
              ₹{basePricePerKg || price}
            </span>
            {originalPrice && originalPrice > (basePricePerKg || Number(price)) && (
              <span className="text-xs text-slate-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider ml-1">
               / {(unitType as any) === 'ml' ? 'L' : 'kg'}
            </span>
          </div>
        </div>

        {/* Premium Rounded Button CTA */}
        <div className="pt-2">
          <Button 
            variant="default"
            className="w-full h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-95"
          >
             View Details
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
