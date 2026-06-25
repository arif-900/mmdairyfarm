import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";

interface ProductCardProps extends Product {}

const ProductCard = (product: ProductCardProps) => {
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
        "group bg-white rounded-[10px] p-4 pb-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-slate-100/50 cursor-pointer",
        isOutOfStock && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] rounded-[10px] overflow-hidden mb-6 shadow-inner bg-slate-50">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-110"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
            <span className="bg-red-600 text-white font-black px-6 py-2 rounded-[10px] shadow-2xl transform -rotate-6 tracking-widest uppercase text-sm">
              Sold Out
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute top-4 right-4 z-10 animate-pulse">
            <span className="bg-amber-500 text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/30 border-2 border-white">
              Only {stock} Left!
            </span>
          </div>
        )}

        {isOnSale && !isOutOfStock && (
          <div className="absolute top-4 -left-2 z-20">
            <span className="bg-red-600 text-white font-black px-4 py-1.5 rounded-r-xl shadow-lg shadow-red-600/30 block tracking-widest uppercase text-[10px] border-y-2 border-r-2 border-white/20">
              SAVE {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-2 space-y-4">
        <div className="space-y-1 text-center">
          <h3 className="font-display text-2xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
          
          {/* Price Display */}
          <div className="flex items-end justify-center gap-2 mt-1 mb-2">
            <span className="text-xl font-black text-emerald-600">
              ₹{basePricePerKg || price}
            </span>
            {originalPrice && originalPrice > (basePricePerKg || Number(price)) && (
              <span className="text-sm font-bold text-slate-400 line-through mb-0.5">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 ml-1">
               per 1 {(unitType as any) === 'ml' ? 'L' : 'kg'}
            </span>
          </div>
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center justify-center pt-4 border-t border-slate-200/50">
          <Button variant="ghost" className="h-8 rounded-full text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 px-4 group/btn">
             View Detail <Plus className="w-3 h-3 ml-1 group-hover/btn:rotate-90 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
