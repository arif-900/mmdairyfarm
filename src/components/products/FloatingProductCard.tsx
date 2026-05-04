import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";

interface FloatingProductCardProps extends Product {
  floatDelay?: number;
}

const FloatingProductCard = (props: FloatingProductCardProps) => {
  const {
    id,
    name,
    basePricePerKg,
    price,
    originalPrice,
    image,
    stock,
    unitType,
    tags,
    floatDelay = 0,
  } = props;

  const navigate = useNavigate();

  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;
  const isOnSale = originalPrice && originalPrice > (basePricePerKg || Number(price));
  const discountPct = isOnSale
    ? Math.round(((originalPrice - (basePricePerKg || Number(price))) / originalPrice) * 100)
    : 0;

  const displayPrice = basePricePerKg || Number(price);
  const unitLabel = (unitType as string) === "ml" ? "L" : "kg";

  return (
    <div
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "group relative cursor-pointer",
        isOutOfStock && "opacity-75"
      )}
      style={{ animationDelay: `${floatDelay}ms` }}
    >
      {/* Continuous float wrapper */}
      <div className="animate-float">

        {/* Full gradient border ring */}
        <div
          className="relative p-[3px] rounded-[20px] shadow-xl shadow-green-500/10 transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-orange-400/20"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 50%, #f97316 100%)' }}
        >
          {/* Card body */}
          <div className="relative rounded-[18px] overflow-hidden bg-white/90 backdrop-blur-sm">

            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
              <img
                src={image}
                alt={name}
                className="w-full h-full object-contain p-3 transition-transform duration-700 group-hover:scale-110"
              />

              {/* Inner glow */}
              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(255,255,255,0.6)] pointer-events-none" />

              {/* Out of stock veil */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                  <span className="bg-red-600 text-white font-black px-5 py-1.5 rounded-xl shadow-lg -rotate-6 tracking-widest uppercase text-xs">
                    Sold Out
                  </span>
                </div>
              )}

              {/* Low stock pill */}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-amber-500 text-white font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-widest shadow-md shadow-amber-400/30 border border-white/30 animate-pulse">
                    Only {stock} left!
                  </span>
                </div>
              )}

              {/* Sale badge */}
              {isOnSale && !isOutOfStock && (
                <div className="absolute top-3 left-0 z-20">
                  <span className="bg-red-600 text-white font-black px-3 py-1 rounded-r-lg shadow-md shadow-red-500/30 text-[9px] uppercase tracking-widest border-y border-r border-white/20">
                    SAVE {discountPct}%
                  </span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">

              {/* Name */}
              <h3 className="font-display text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/8 text-primary rounded-full border border-primary/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price row + CTA */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-black text-primary">
                    ₹{displayPrice}
                  </span>
                  {isOnSale && (
                    <span className="text-xs font-semibold text-slate-400 line-through mb-0.5">
                      ₹{originalPrice}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    /1 {unitLabel}
                  </span>
                </div>

                <button className="flex items-center gap-1 bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                  View
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Soft cast shadow beneath card */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/5 blur-xl rounded-full transition-all duration-500 group-hover:w-full group-hover:bg-orange-400/15" />
      </div>
    </div>
  );
};

export default FloatingProductCard;
