import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";

interface ProductCardProps extends Product {}

const ProductCard = memo(function ProductCard(product: ProductCardProps) {
  const { id, name, description, price, basePricePerKg, image, stock, unitType, originalPrice } = product;
  const navigate = useNavigate();
  
  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;
  const isOnSale = originalPrice && originalPrice > (basePricePerKg || Number(price));
  const discountPercent = isOnSale ? Math.round(((originalPrice - (basePricePerKg || Number(price))) / originalPrice) * 100) : 0;

  return (
    <div 
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "group bg-white rounded-2xl p-5 transition-all duration-300 shadow-soft hover:shadow-card hover:-translate-y-1 border border-slate-200/80 cursor-pointer flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800",
        isOutOfStock && "opacity-80 grayscale-[0.3]"
      )}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
        <img
          src={image}
          alt={name}
          width="400"
          height="300"
          loading="lazy"
          decoding="async"
          className="w-4/5 h-4/5 object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-rose-600 text-white font-bold px-3 py-1 rounded-full text-xs tracking-wider uppercase shadow-sm">
              Sold Out
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
              Only {stock} Left
            </span>
          </div>
        )}

        {isOnSale && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
              Save {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              ₹{basePricePerKg || price}
            </span>
            {originalPrice && originalPrice > (basePricePerKg || Number(price)) && (
              <span className="text-xs text-slate-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-medium">
               / {(unitType as any) === 'ml' ? 'L' : 'kg'}
            </span>
          </div>

          <Button 
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark text-xs px-3.5 h-9 font-semibold shadow-soft"
          >
             View
             <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;

