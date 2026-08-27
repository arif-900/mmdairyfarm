import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useSingleProductQuery } from "@/hooks/useSingleProductQuery";
import { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { calculatePrice, formatWeight } from "@/utils/pricing";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Calendar,
  Truck,
  ShieldCheck,
  ChevronLeft,
  Star,
  Leaf,
  Award,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product: fetchedProduct, loading: productsLoading } = useSingleProductQuery(id);
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(1000);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!productsLoading) {
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        setSelectedWeight(fetchedProduct.availableWeights?.[0] || 1000);
      } else if (id) {
        toast({
          title: "Product Not Found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/products");
      }
    }
  }, [id, fetchedProduct, productsLoading, navigate, toast]);

  if (productsLoading || !product) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const { name, description, price, basePricePerKg, image, stock, availableWeights, unitType, deliveryDays, originalPrice, rating, reviewCount } = product;

  const isOutOfStock = stock !== undefined && stock <= 0;
  const currentPrice = calculatePrice(basePricePerKg || Number(price), selectedWeight);
  const calculatedOriginalPrice = originalPrice ? calculatePrice(originalPrice, selectedWeight) : undefined;
  const isOnSale = originalPrice && originalPrice > (basePricePerKg || Number(price));

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      productId: product.id,
      name,
      selectedWeight,
      calculatedPrice: currentPrice,
      quantity,
      stock,
      image,
      unitType,
      deliveryDays,
    });

    setTimeout(() => {
      setIsAdding(false);
      toast({
        title: "Added to Cart",
        description: `${quantity} x ${name} (${formatWeight(selectedWeight, unitType as any)}) added to your cart.`,
      });
    }, 600);
  };

  const handleBuyNow = () => {
    const buyNowItem = {
      productId: product.id,
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

  return (
    <Layout>
      <div className="min-h-screen bg-[#061A13] text-[#F5F3EC]">
        <div className="relative">
          <div className="container-main pt-6">
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 text-[#AAB8B0] hover:text-[#C98A24] transition-colors font-body font-bold uppercase text-xs tracking-widest mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Shop
            </button>
          </div>

          <div className="container-main pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div className="space-y-4">
                <div className="aspect-square bg-[#F1EEE7] rounded-[24px] p-8 sm:p-10 shadow-2xl border border-white/10 flex items-center justify-center sticky top-24">
                  <img
                    src={image}
                    alt={name}
                    width="600"
                    height="600"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full !object-contain object-center hover:scale-105 transition-transform duration-700"
                  />

                  {isOnSale && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-[#C98A24] text-white font-body font-extrabold px-4 py-1.5 rounded-[10px] tracking-wider uppercase text-xs shadow-lg">
                        Save {Math.round(((originalPrice! - (basePricePerKg || Number(price))) / originalPrice!) * 100)}%
                      </span>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-[24px] flex items-center justify-center z-10">
                      <span className="bg-[#0B2118] text-[#F5F3EC] font-display font-bold px-8 py-4 rounded-xl border border-white/10 uppercase tracking-widest text-lg">
                        Currently Unavailable
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#0F8A5F]/20 text-[#4ADE80] border border-[#0F8A5F]/30 font-body font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">Farm Fresh</span>
                    <span className="bg-[#C98A24]/20 text-[#D9A441] border border-[#C98A24]/30 font-body font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">100% Pure Quality</span>
                  </div>

                  <h1 className="font-display text-4xl md:text-5xl font-black text-[#F5F3EC] leading-[1.1]">
                    {name}
                  </h1>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(rating || 0) ? "text-[#C98A24] fill-[#C98A24]" : "text-white/20"
                        )}
                      />
                    ))}
                    <span className="text-xs font-body font-semibold text-[#AAB8B0] ml-1">
                      ({reviewCount || 0} reviews)
                    </span>
                  </div>

                  <div className="flex items-end gap-4 pt-2">
                    <div className="flex items-end gap-3">
                      <span className="text-4xl font-display font-black text-[#C98A24]">₹{currentPrice}</span>
                      {isOnSale && (
                        <span className="text-lg font-body text-[#718078] line-through mb-1">₹{calculatedOriginalPrice}</span>
                      )}
                    </div>
                    <span className="h-8 w-px bg-white/10" />
                    <span className="text-xs font-body font-bold text-[#AAB8B0] uppercase tracking-widest">
                      per {formatWeight(selectedWeight, unitType as any)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[#AAB8B0] text-base leading-relaxed font-body">
                    {description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-4 bg-[#0B2118] border border-white/10 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-[#10291F] flex items-center justify-center text-[#C98A24] border border-white/10">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-body font-bold text-[#718078] uppercase tracking-widest">Delivery</p>
                        <p className="text-sm font-display font-bold text-[#F5F3EC]">{deliveryDays || 1} {deliveryDays === 1 ? 'Day' : 'Days'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#0B2118] border border-white/10 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-[#10291F] flex items-center justify-center text-[#C98A24] border border-white/10">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-body font-bold text-[#718078] uppercase tracking-widest">Quality</p>
                        <p className="text-sm font-display font-bold text-[#F5F3EC]">100% Pure</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B2118] rounded-2xl p-6 shadow-xl border border-white/10 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-body font-bold uppercase tracking-widest text-[#AAB8B0]">Select Variant</label>
                      <span className="text-[10px] font-body font-bold text-[#C98A24] uppercase tracking-widest bg-[#C98A24]/10 px-2 py-0.5 rounded-md border border-[#C98A24]/20">Required</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableWeights?.map((weight) => (
                        <button
                          key={weight}
                          onClick={() => setSelectedWeight(weight)}
                          disabled={isOutOfStock}
                          className={cn(
                            "min-w-[90px] h-12 rounded-xl font-body font-bold text-xs uppercase transition-all flex items-center justify-center border px-5",
                            selectedWeight === weight
                              ? "bg-[#C98A24] border-[#C98A24] text-[#061A13] shadow-lg font-black"
                              : "bg-[#10291F] border-white/10 text-[#F5F3EC] hover:border-[#C98A24]/40"
                          )}
                        >
                          {formatWeight(weight, (unitType as "g" | "ml") || "g")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-body font-bold uppercase tracking-widest text-[#AAB8B0]">Quantity</label>
                        <div className="flex items-center justify-between bg-[#10291F] border border-white/10 rounded-xl p-1 h-14">
                          <button
                            onClick={() => handleQuantityDelta(-1)}
                            className="w-10 h-10 rounded-lg bg-[#0B2118] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors border border-white/10"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-display font-bold text-[#F5F3EC]">{quantity}</span>
                          <button
                            onClick={() => handleQuantityDelta(1)}
                            disabled={stock !== undefined && quantity >= stock}
                            className="w-10 h-10 rounded-lg bg-[#0B2118] flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors border border-white/10 disabled:opacity-30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-body font-bold uppercase tracking-widest text-[#AAB8B0] text-right block">Subtotal</label>
                        <div className="h-14 flex items-center justify-end">
                          <span className="text-3xl font-display font-black text-[#C98A24]">₹{currentPrice * quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        disabled={isOutOfStock || isAdding}
                        onClick={handleAddToCart}
                        className={cn(
                          "h-14 rounded-xl font-body font-bold text-xs tracking-widest shadow-lg transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-3",
                          isAdding
                            ? "bg-[#0F8A5F] text-white"
                            : "bg-[#0F8A5F] hover:bg-[#123B2A] text-white"
                        )}
                      >
                        {isAdding ? "DONE!" : (
                          <>
                            <ShoppingBag className="w-5 h-5" />
                            ADD TO CART
                          </>
                        )}
                      </Button>
                      <Button
                        disabled={isOutOfStock}
                        onClick={handleBuyNow}
                        className="h-14 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-body font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        <Zap className="w-5 h-5" />
                        BUY NOW
                      </Button>
                    </div>

                    <Button
                      disabled={isOutOfStock}
                      onClick={() => {
                        navigate(`/subscriptions?productId=${product.id}&weight=${selectedWeight}&unitType=${unitType || 'ml'}&quantity=${quantity}&add-config=true`);
                      }}
                      className="h-14 rounded-xl bg-[#10291F] border border-[#C98A24]/40 hover:bg-[#164431] text-[#F5F3EC] font-body font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 w-full"
                    >
                      <Calendar className="w-5 h-5 text-[#C98A24]" />
                      START MONTHLY SUBSCRIPTION
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2 p-4 bg-[#0B2118] border border-white/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#10291F] flex items-center justify-center mx-auto text-[#0F8A5F]">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-[#AAB8B0]">Organic Feed</p>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-[#0B2118] border border-white/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#10291F] flex items-center justify-center mx-auto text-[#C98A24]">
                      <Award className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-[#AAB8B0]">Zero Additives</p>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-[#0B2118] border border-white/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#10291F] flex items-center justify-center mx-auto text-[#0F8A5F]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-[#AAB8B0]">Lab Tested</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
