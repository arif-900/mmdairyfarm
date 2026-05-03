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
  Leaf, 
  Award, 
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularBackButton } from "@/components/ui/CircularBackButton";

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

  const { name, description, price, basePricePerKg, image, stock, availableWeights, unitType, deliveryDays, originalPrice } = product;

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
      <div 
        className="relative min-h-screen pb-20 overflow-hidden"
        style={{
          background: product.backgroundGif ? 'transparent' : 'white'
        }}
      >
        {/* Dynamic Background */}
        {product.backgroundGif && (
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-900">
            {product.backgroundGif.match(/\.(mp4|webm|ogg)$|vimeo|youtube/) ? (
              <video
                key={product.backgroundGif}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 blur-[1px] transition-opacity duration-1000"
                onLoadedData={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                <source src={product.backgroundGif} type="video/mp4" />
              </video>
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 opacity-0 blur-[1px] transition-opacity duration-1000"
                style={{ 
                  backgroundImage: `url(${product.backgroundGif})`,
                }}
                onLoad={(e) => (e.currentTarget.style.opacity = "0.5")}
                ref={(el) => {
                  if (el) {
                    const img = new Image();
                    img.src = product.backgroundGif!;
                    img.onload = () => { el.style.opacity = "0.5"; };
                  }
                }}
              />
            )}
            {/* Light transparent overlay for minimal contrast */}
            <div className="absolute inset-0 bg-transparent backdrop-blur-[1px]" />
          </div>
        )}

        <div className="relative z-10">
          {/* Navigation Header */}
          <div className="container-main pt-8">
            <button 
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest mb-8"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Shop
            </button>
          </div>

          <div className="container-main">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image Gallery Section */}
            <div className="space-y-6">
              <div className="aspect-square bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200 border border-slate-100 flex items-center justify-center sticky top-24">
                <img 
                  src={image} 
                  alt={name} 
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-700"
                />
                
                {isOnSale && (
                  <div className="absolute top-8 left-8">
                    <span className="bg-red-600 text-white font-black px-6 py-2 rounded-2xl shadow-xl shadow-red-600/20 tracking-widest uppercase text-xs border-2 border-white/20">
                      Flash Sale
                    </span>
                  </div>
                )}
                
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-[48px] flex items-center justify-center z-10">
                    <span className="bg-slate-900 text-white font-black px-10 py-4 rounded-3xl shadow-2xl transform -rotate-3 tracking-[0.2em] uppercase text-xl">
                      Currently Unavailable
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className={cn(
              "space-y-10 lg:pl-4 p-8 rounded-[40px] transition-all duration-500",
              product.backgroundGif ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-xl" : ""
            )}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">Farm Fresh</span>
                  <span className="bg-indigo-100 text-indigo-700 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">Premium Quality</span>
                </div>
                
                <h1 className="font-display text-5xl md:text-6xl font-black text-slate-900 leading-[0.9] tracking-tighter italic uppercase">
                  {name}
                </h1>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter italic">₹{currentPrice}</span>
                    {isOnSale && (
                      <span className="text-xl font-bold text-slate-400 line-through mb-1.5 opacity-60">₹{calculatedOriginalPrice}</span>
                    )}
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Price per {formatWeight(selectedWeight, unitType as any)}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  {description}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</p>
                      <p className="text-sm font-black text-slate-800">{deliveryDays || 1} {deliveryDays === 1 ? 'Day' : 'Days'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality</p>
                      <p className="text-sm font-black text-slate-800">100% Pure</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Section */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                {/* Weight Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Variant</label>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">Required</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableWeights?.map((weight) => (
                      <button
                        key={weight}
                        onClick={() => setSelectedWeight(weight)}
                        disabled={isOutOfStock}
                        className={cn(
                          "min-w-[100px] h-14 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center border-2 px-6",
                          selectedWeight === weight
                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-primary/30"
                        )}
                      >
                        {formatWeight(weight, (unitType as "g" | "ml") || "g")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</label>
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-2 px-6 h-16 shadow-inner">
                        <button 
                          onClick={() => handleQuantityDelta(-1)}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-xl font-black text-slate-900">{quantity}</span>
                        <button 
                          onClick={() => handleQuantityDelta(1)}
                          disabled={stock !== undefined && quantity >= stock}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right block">Subtotal</label>
                      <div className="h-16 flex items-center justify-end">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{currentPrice * quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button 
                      disabled={isOutOfStock || isAdding}
                      onClick={handleAddToCart}
                      className={cn(
                        "h-16 rounded-3xl font-black text-xs tracking-widest shadow-2xl transition-all active:scale-95 border-b-4 uppercase flex items-center justify-center gap-3",
                        isAdding 
                          ? "bg-emerald-500 border-emerald-700 text-white" 
                          : "bg-primary hover:bg-primary/90 border-indigo-700 text-white shadow-primary/30"
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
                      className="h-16 rounded-3xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
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
                    className="h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 border-b-4 border-indigo-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 w-full"
                  >
                    <Calendar className="w-5 h-5" />
                    START MONTHLY SUBSCRIPTION
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center space-y-2 opacity-60">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-tighter">Organic Feed</p>
                </div>
                <div className="text-center space-y-2 opacity-60">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-tighter">Zero Additives</p>
                </div>
                <div className="text-center space-y-2 opacity-60">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-tighter">Lab Tested</p>
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
