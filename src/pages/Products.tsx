import { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import FloatingProductCard from "@/components/products/FloatingProductCard";
import { useStoreProducts } from "@/data/products";
import { Loader2, Search, ShoppingBag, Leaf, ShieldCheck, Timer } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Products = () => {
  const navigate = useNavigate();
  const { products, loading } = useStoreProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [products, searchQuery]);

  return (
    <Layout>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <section className="pt-6 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-6">
          <div className="container-main">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
              <div className="space-y-2 sm:space-y-4">
                <CircularBackButton 
                  onClick={() => navigate("/")} 
                  className="mb-1 sm:mb-2 bg-white text-forest hover:bg-primary hover:text-white shadow-md border border-forest/10 w-8 h-8 sm:w-10 sm:h-10" 
                />
                <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[0.9] sm:leading-[0.85] tracking-tight text-forest">
                  Our <span className="text-golden">Products</span>
                </h1>
                <p className="text-earth/50 font-body font-bold uppercase text-[9px] sm:text-[11px] md:text-xs tracking-[0.25em] sm:tracking-[0.3em] pl-1">
                  Pure &bull; Fresh &bull; Farm to Table
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
                 <div className="relative group flex-1 sm:w-72 md:w-80">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/30 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 sm:h-12 md:h-14 pl-9 sm:pl-12 pr-4 bg-white border-forest/10 rounded-lg font-body font-semibold text-xs sm:text-sm placeholder:text-earth/30 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all shadow-soft"
                    />
                 </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="section-padding bg-cream/30 min-h-[400px]">
        <div className="container-main">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
              </div>
              <p className="text-xs font-body font-bold uppercase tracking-[0.3em] text-forest/40 animate-pulse">Loading Freshness...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-24 bg-white rounded-[10px] border border-forest/5 shadow-card">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-forest/30" />
              </div>
              <h2 className="font-display text-2xl font-bold text-forest">No Products Found</h2>
              <p className="text-earth/50 font-body font-semibold uppercase text-xs tracking-widest mt-2">Try adjusting your search query</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mt-8 rounded-[10px] font-body font-bold text-xs uppercase tracking-widest border-forest/20 text-forest hover:bg-primary hover:text-white hover:border-primary"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 pt-2 pb-6">
                {filteredProducts.map((product, index) => (
                  <FloatingProductCard
                    key={product.id}
                    {...product}
                    floatDelay={(index % 4) * 600}
                  />
                ))}
              </div>
              <div className="text-center py-8 text-earth/40 font-body font-semibold text-xs uppercase tracking-widest">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container-main px-4">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-block text-golden font-body font-bold text-xs uppercase tracking-widest mb-4">Why Us</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest mb-4">Uncompromising <span className="text-golden">Quality</span></h2>
            <p className="text-earth/60 font-body font-medium leading-relaxed">
              We believe in transparency and traditional methods. Our cattle are part of our family, 
              and we ensure they get the best care, which results in the purest milk for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white rounded-[10px] shadow-card hover:shadow-elevated transition-all duration-500 group border border-forest/5">
              <div className="w-14 h-14 rounded-[10px] bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-forest mb-3 text-lg">Purity Guaranteed</h3>
              <p className="text-sm text-earth/60 font-body leading-relaxed">
                100% pure milk with no preservatives, chemicals or water added. Straight from the farm to your table.
              </p>
            </div>
            <div className="p-8 bg-white rounded-[10px] shadow-card hover:shadow-elevated transition-all duration-500 group border border-forest/5">
              <div className="w-14 h-14 rounded-[10px] bg-golden/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <Leaf className="w-7 h-7 text-golden" />
              </div>
              <h3 className="font-display font-bold text-forest mb-3 text-lg">Natural Feed</h3>
              <p className="text-sm text-earth/60 font-body leading-relaxed">
                Our cattle are fed with organic fodder and clean drinking water, ensuring the highest nutritional value.
              </p>
            </div>
            <div className="p-8 bg-white rounded-[10px] shadow-card hover:shadow-elevated transition-all duration-500 group border border-forest/5">
              <div className="w-14 h-14 rounded-[10px] bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <Timer className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-forest mb-3 text-lg">Same Day Fresh</h3>
              <p className="text-sm text-earth/60 font-body leading-relaxed">
                Milked in the early hours and delivered to your doorstep by morning. Experience true freshness every day.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
