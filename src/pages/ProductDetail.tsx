import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useStoreProducts, Product } from "@/data/products";
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
  const { products, loading: productsLoading } = useStoreProducts();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(1000);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      const foundProduct = products.find((p) => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedWeight(foundProduct.availableWeights?.[0] || 1000);
      } else {
        toast({
          title: "Product Not Found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/products");
      }
    }
  }, [id, products, productsLoading, navigate, toast]);

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
      <div className="min-h-screen bg-gradient-to-b from-cream/20 via-white to-cream/20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/[0.03] blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-golden/[0.03] blur-3xl" />
        </div>

        <div className="relative">
          <div className="container-main pt-6">
            <button 
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 text-earth/50 hover:text-primary transition-colors font-body font-bold uppercase text-xs tracking-widest mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Shop
            </button>
          </div>

          <div className="container-main pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div className="space-y-4">
                <div className="aspect-square bg-white rounded-[10px] p-10 shadow-card border border-forest/5 flex items-center justify-center sticky top-24">
                  <img 
                    src={image} 
                    alt={name} 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-700"
                  />
                  
                  {isOnSale && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-destructive text-destructive-foreground font-body font-bold px-4 py-1.5 rounded-[10px] tracking-wider uppercase text-xs shadow-lg">
                        Flash Sale
                      </span>
                    </div>
                  )}
                  
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[10px] flex items-center justify-center z-10">
                      <span className="bg-forest text-cream font-display font-bold px-8 py-4 rounded-[10px] shadow-elevated uppercase tracking-widest text-lg">
                        Currently Unavailable
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary font-body font-bold px-3 py-1 rounded-[10px] text-[10px] uppercase tracking-widest">Farm Fresh</span>
                    <span className="bg-golden/10 text-golden-dark font-body font-bold px-3 py-1 rounded-[10px] text-[10px] uppercase tracking-widest">Premium Quality</span>
                  </div>
                  
                  <h1 className="font-display text-4xl md:text-5xl font-bold text-forest leading-[1.1]">
                    {name}
                  </h1>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(rating || 0) ? "text-golden fill-golden" : "text-forest/10"
                        )}
                      />
                    ))}
                    <span className="text-xs font-body font-semibold text-earth/40 ml-1">
                      ({reviewCount || 0} reviews)
                    </span>
                  </div>

                  <div className="flex items-end gap-4 pt-2">
                    <div className="flex items-end gap-3">
                      <span className="text-4xl font-display font-bold text-primary">₹{currentPrice}</span>
                      {isOnSale && (
                        <span className="text-lg font-body text-earth/40 line-through mb-1">₹{calculatedOriginalPrice}</span>
                      )}
                    </div>
                    <span className="h-8 w-px bg-forest/10" />
                    <span className="text-xs font-body font-semibold text-earth/40 uppercase tracking-widest">
                      per {formatWeight(selectedWeight, unitType as any)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-earth/70 text-base leading-relaxed font-body">
                    {description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-4 bg-cream/50 rounded-[10px]">
                      <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-body font-bold text-earth/40 uppercase tracking-widest">Delivery</p>
                        <p className="text-sm font-display font-bold text-forest">{deliveryDays || 1} {deliveryDays === 1 ? 'Day' : 'Days'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-cream/50 rounded-[10px]">
                      <div className="w-10 h-10 rounded-[10px] bg-golden/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-golden" />
                      </div>
                      <div>
                        <p className="text-[10px] font-body font-bold text-earth/40 uppercase tracking-widest">Quality</p>
                        <p className="text-sm font-display font-bold text-forest">100% Pure</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[10px] p-6 shadow-card border border-forest/5 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-body font-bold uppercase tracking-widest text-earth/50">Select Variant</label>
                      <span className="text-[10px] font-body font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-[10px]">Required</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableWeights?.map((weight) => (
                        <button
                          key={weight}
                          onClick={() => setSelectedWeight(weight)}
                          disabled={isOutOfStock}
                          className={cn(
                            "min-w-[90px] h-12 rounded-[10px] font-body font-bold text-xs uppercase transition-all flex items-center justify-center border-2 px-5",
                            selectedWeight === weight
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                              : "bg-cream/50 border-transparent text-earth/50 hover:border-primary/30 hover:text-primary"
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
                        <label className="text-[10px] font-body font-bold uppercase tracking-widest text-earth/50">Quantity</label>
                        <div className="flex items-center justify-between bg-cream/50 rounded-[10px] p-1 h-14">
                          <button 
                            onClick={() => handleQuantityDelta(-1)}
                            className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-forest hover:text-primary transition-colors shadow-sm"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-display font-bold text-forest">{quantity}</span>
                          <button 
                            onClick={() => handleQuantityDelta(1)}
                            disabled={stock !== undefined && quantity >= stock}
                            className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-forest hover:text-primary transition-colors shadow-sm disabled:opacity-30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-body font-bold uppercase tracking-widest text-earth/50 text-right block">Subtotal</label>
                        <div className="h-14 flex items-center justify-end">
                          <span className="text-3xl font-display font-bold text-forest">₹{currentPrice * quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        disabled={isOutOfStock || isAdding}
                        onClick={handleAddToCart}
                        className={cn(
                          "h-14 rounded-[10px] font-body font-bold text-xs tracking-widest shadow-lg transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-3",
                          isAdding 
                            ? "bg-primary text-white shadow-primary/30" 
                            : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
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
                        className="h-14 rounded-[10px] bg-golden hover:bg-golden-dark text-white font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-golden/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
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
                      className="h-14 rounded-[10px] bg-forest hover:bg-forest-dark text-cream font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-forest/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 w-full"
                    >
                      <Calendar className="w-5 h-5" />
                      START MONTHLY SUBSCRIPTION
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2 p-4 bg-cream/30 rounded-[10px]">
                    <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center mx-auto">
                      <Leaf className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-earth/50">Organic Feed</p>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-cream/30 rounded-[10px]">
                    <div className="w-10 h-10 rounded-[10px] bg-golden/10 flex items-center justify-center mx-auto">
                      <Award className="w-5 h-5 text-golden" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-earth/50">Zero Additives</p>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-cream/30 rounded-[10px]">
                    <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-wider text-earth/50">Lab Tested</p>
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
