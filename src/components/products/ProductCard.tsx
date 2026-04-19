import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Star, Plus, Minus, ShoppingBag, Leaf, Award, Zap, Calendar, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePrice, formatWeight } from "@/utils/pricing";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/data/products";

interface ProductCardProps extends Product {}

const ProductCard = (product: ProductCardProps) => {
  const { id, name, description, price, basePricePerKg, image, stock, availableWeights, unitType, tags, rating, reviewCount, deliveryDays, originalPrice } = product;
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedWeight, setSelectedWeight] = useState<number>(availableWeights?.[0] || 1000);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = stock !== undefined && stock <= 0;
  const currentPrice = calculatePrice(basePricePerKg || Number(price), selectedWeight);
  const calculatedOriginalPrice = originalPrice ? calculatePrice(originalPrice, selectedWeight) : undefined;
  
  const isOnSale = originalPrice && originalPrice > (basePricePerKg || Number(price));
  const discountPercent = isOnSale ? Math.round(((originalPrice - (basePricePerKg || Number(price))) / originalPrice) * 100) : 0;

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      productId: id,
      name,
      selectedWeight,
      calculatedPrice: currentPrice,
      quantity,
      stock,
      image,
      unitType,
      deliveryDays,
    });
    
    // Simple feedback animation
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleBuyNow = () => {
    const buyNowItem = {
      productId: id,
      name,
      selectedWeight,
      calculatedPrice: currentPrice,
      quantity,
      image,
      unitType,
      deliveryDays,
      selected: true
    };
    navigate("/order", { state: { buyNowItem } });
  };

  const handleQuantityDelta = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (stock !== undefined && next > stock) {
        toast({
          title: "Stock Limit",
          description: `Sorry, only ${stock} units available.`,
          variant: "destructive"
        });
        return stock;
      }
      return next;
    });
  };

  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;

  return (
    <div 
      className={cn(
        "group bg-white rounded-[40px] p-4 pb-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-slate-100/50",
        isOutOfStock && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden mb-6 shadow-inner bg-slate-50">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-110"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
            <span className="bg-red-600 text-white font-black px-6 py-2 rounded-2xl shadow-2xl transform -rotate-6 tracking-widest uppercase">
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
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-black text-slate-900 leading-tight tracking-tight">
            {name}
          </h3>
          
          {/* Price Display */}
          <div className="flex items-end gap-2 mt-1 mb-2">
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

          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 italic pt-1">
            {description}
          </p>
          {deliveryDays && deliveryDays > 0 && (
             <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl w-fit">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Delivers in {deliveryDays} {deliveryDays === 1 ? 'Day' : 'Days'}
                </span>
             </div>
          )}
        </div>

        {/* Weight Selector */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
          {availableWeights?.map((weight) => (
            <button
              key={weight}
              onClick={() => setSelectedWeight(weight)}
              disabled={isOutOfStock}
              className={cn(
                "min-w-[70px] h-10 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center border-2",
                selectedWeight === weight
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white border-slate-100 text-slate-400 hover:border-primary/30"
              )}
            >
              {formatWeight(weight, (unitType as "g" | "ml") || "g")}
            </button>
          ))}
        </div>

        {/* Action Section */}
        <div className="flex flex-col gap-4 pt-2">
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-2 px-4 shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleQuantityDelta(-1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-black w-4 text-center">{quantity}</span>
              <button 
                onClick={() => handleQuantityDelta(1)}
                disabled={stock !== undefined && quantity >= stock}
                className={cn(
                  "w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm disabled:opacity-30 disabled:cursor-not-allowed",
                )}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <Button 
                disabled={isOutOfStock || isAdding}
                onClick={handleAddToCart}
                className={cn(
                  "group h-14 rounded-2xl font-black text-xs tracking-widest shadow-lg transition-all active:scale-95 border-b-4 uppercase relative overflow-hidden",
                  isAdding 
                    ? "bg-emerald-500 border-emerald-700 text-white" 
                    : "bg-primary hover:bg-primary/90 border-indigo-700 text-white shadow-primary/20"
                )}
              >
                {isAdding ? "DONE!" : "ADD TO CART "}
              </Button>
              <Button 
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                BUY
              </Button>
          </div>

          <div className="bg-primary/5 rounded-2xl p-3 flex items-center justify-between border border-primary/10">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Amount</span>
             <div className="flex items-center gap-2">
                 {isOnSale && (
                     <span className="text-sm font-bold text-rose-500 line-through">
                         ₹{calculatedOriginalPrice! * quantity}
                     </span>
                 )}
                 <span className="text-lg font-black text-primary">₹{currentPrice * quantity}</span>
             </div>
          </div>
        </div>

        {/* Footer Indicators */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200/50">
          <div className="flex items-center gap-1.5 grayscale opacity-60">
             <div className="bg-emerald-500/20 p-1 rounded-full"><Leaf className="h-3 w-3 text-emerald-600" /></div>
             <span className="text-[10px] font-black uppercase tracking-tighter">Pure Farm</span>
          </div>
          <div className="flex items-center gap-1.5 grayscale opacity-60">
             <div className="bg-emerald-500/20 p-1 rounded-full"><Award className="h-3 w-3 text-emerald-600" /></div>
             <span className="text-[10px] font-black uppercase tracking-tighter">No Added</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
