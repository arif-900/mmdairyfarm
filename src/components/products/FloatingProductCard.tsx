import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";

interface FloatingProductCardProps extends Product {
  floatDelay?: number;
}

const FloatingProductCard = memo(function FloatingProductCard(props: FloatingProductCardProps) {
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

        {/* Outer White Card Container with responsive padding and border */}
        <div className="relative rounded-xl md:rounded-[20px] overflow-hidden bg-white border border-[#F1F5F9] p-2.5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] group-hover:-translate-y-[6px] group-hover:scale-[1.02]">

          {/* Image Section */}
          <div className="relative aspect-[4/3] rounded-lg md:rounded-[16px] overflow-hidden bg-[#FAFAFA] flex items-center justify-center border border-slate-50 mb-1.5 md:mb-4">
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
              className="w-4/5 h-4/5 object-contain p-0.5 md:p-2 transition-transform duration-500 group-hover:scale-110"
            />

            {/* Out of stock veil */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <span className="bg-red-500 text-white font-bold px-2 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm text-[8px] md:text-xs tracking-wider uppercase">
                  Sold Out
                </span>
              </div>
            )}

            {/* Low stock pill */}
            {isLowStock && !isOutOfStock && (
              <div className="absolute top-1 md:top-3 right-1 md:right-3 z-10">
                <span className="bg-amber-500 text-white font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[7px] md:text-[9px] uppercase tracking-wider shadow-sm border border-white/20">
                  Only {stock} left!
                </span>
              </div>
            )}

            {/* Sale badge */}
            {isOnSale && !isOutOfStock && (
              <div className="absolute top-1 md:top-3 left-1 md:left-3 z-20">
                <span className="bg-red-500 text-white font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full shadow-sm text-[7px] md:text-[9px] uppercase tracking-wider border border-white/10">
                  Save {discountPct}%
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-1.5 md:space-y-4">
            <div className="space-y-0.5 md:space-y-1.5 text-center">
              {/* Name */}
              <h3 className="font-sans text-xs md:text-lg font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5 md:mt-1.5">
                  {tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1 md:px-2 py-0.5 text-[7px] md:text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary rounded-full border border-primary/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price row + CTA */}
            <div className="flex items-center justify-between pt-1 md:pt-3 border-t border-slate-100/60 gap-0.5">
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-[11px] md:text-xl font-bold text-slate-900">
                  ₹{displayPrice}
                </span>
                {isOnSale && (
                  <span className="text-[8px] md:text-xs text-slate-400 line-through">
                    ₹{originalPrice}
                  </span>
                )}
                <span className="text-[7px] md:text-[9px] text-slate-400 font-normal uppercase tracking-wider ml-0.5">
                  /{unitLabel}
                </span>
              </div>

              {/* Touch friendly premium CTA */}
              <button className="flex items-center gap-0.5 bg-slate-900 hover:bg-slate-800 text-white px-2 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 shrink-0">
                View
                <ArrowRight className="w-2 h-2 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default FloatingProductCard;
