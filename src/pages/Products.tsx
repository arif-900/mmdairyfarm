import { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useStoreProducts } from "@/data/products";
import { Loader2, Search, ShoppingBag } from "lucide-react";
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
      {/* Premium Hero Section */}
      <section className="bg-white border-b border-slate-100 pt-16 pb-12 px-6">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <CircularBackButton 
                onClick={() => navigate("/")} 
                className="mb-4 bg-slate-50 !text-slate-900 hover:bg-primary hover:!text-white shadow-sm border border-slate-100" 
              />
              <h1 className="font-display text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.85]">
                Our <span className="text-primary">Products</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] pl-1">
                Pure • Fresh • Farm to Table
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
               <div className="relative group flex-1 sm:w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search fresh products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-16 pl-14 pr-6 bg-slate-50 border-slate-100 rounded-[28px] font-bold text-sm placeholder:text-slate-300 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all shadow-inner"
                  />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section-padding bg-slate-50/50 min-h-[400px]">
        <div className="container-main">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Freshness...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-24 bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 italic uppercase">No Products Found</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Try adjusting your search query</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mt-8 rounded-2xl border-2 font-black text-xs uppercase tracking-widest"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="section-padding bg-cream/50">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4 uppercase tracking-tight italic">Why Choose Our <span className="text-primary">Farm Fresh</span> Quality?</h2>
            <p className="text-slate-500 font-medium">
              We believe in transparency and traditional methods. Our cattle are part of our family, 
              and we ensure they get the best care, which results in the purest milk for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-white rounded-[40px] shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-500 group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">🥛</div>
              <h3 className="font-black text-slate-900 mb-3 uppercase tracking-tighter italic text-xl">Purity Guaranteed</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                100% pure milk with no preservatives, chemicals or water added. Straight from the farm to your table.
              </p>
            </div>
            <div className="p-10 bg-white rounded-[40px] shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-500 group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">🌿</div>
              <h3 className="font-black text-slate-900 mb-3 uppercase tracking-tighter italic text-xl">Natural Feed</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Our cattle are fed with organic fodder and clean drinking water, ensuring the highest nutritional value.
              </p>
            </div>
            <div className="p-10 bg-white rounded-[40px] shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-500 group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">⏰</div>
              <h3 className="font-black text-slate-900 mb-3 uppercase tracking-tighter italic text-xl">Same Day Fresh</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
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
