import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, ShieldCheck, Heart, Leaf, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useStoreProducts } from "@/data/products";
import heroPoster1200 from "@/assets/hero-farm-1200.webp";
import heroPoster640 from "@/assets/hero-farm-640.webp";
import TextType from "@/components/ui/TextType";
import { useCart } from "@/contexts/CartContext";
import { MakingOfSection } from "@/components/home/MakingOfSection";
import { PromoCarousel } from "@/components/home/PromoCarousel";

const Index = () => {
  const navigate = useNavigate();
  const { products, loading } = useStoreProducts();
  const { addItem } = useCart();

  // Limit to ONLY 4 products for homepage
  const homepageProducts = products.slice(0, 4);

  return (
    <Layout>
      {/* 1. IMAGE PROMOTIONAL CAROUSEL (DYNAMIC ADMIN BANNERS) */}
      <PromoCarousel />

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative min-h-[70vh] sm:min-h-[82vh] flex items-center bg-[#061A13] text-[#F5F3EC] overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroPoster1200}
            srcSet={`${heroPoster640} 640w, ${heroPoster1200} 1200w`}
            sizes="(max-width: 768px) 100vw, 1200px"
            alt="MMVALI Dairy Farm"
            width="1200"
            height="800"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover blur-[1px] scale-105 opacity-40"
          />
          {/* Dark luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061A13] via-[#061A13]/85 to-transparent z-20" />
        </div>

        <div className="relative z-30 container-main py-16 sm:py-24">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B2118] border border-white/10 text-[#C98A24] font-medium text-xs uppercase tracking-widest">
              <Leaf className="w-3.5 h-3.5" />
              PURE BY NATURE, MADE WITH CARE
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-none text-[#F5F3EC] tracking-tight">
              Pure Dairy Goodness, Fresh From <span className="text-[#C98A24]">Our Farm</span>
            </h1>

            <p className="text-[#AAB8B0] text-base sm:text-lg leading-relaxed max-w-xl">
              Experience the excellence of premium, farm-to-doorstep dairy. We are dedicated to providing the purest natural nutrition, rooted in a commitment to quality that spans generations.
            </p>

            {/* 3. HERO TRUST POINTS (4 Items) */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#C98A24] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F5F3EC]">100% Pure & Natural</p>
                  <p className="text-[10px] text-[#718078]">No additives, ever</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Leaf className="w-5 h-5 text-[#C98A24] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F5F3EC]">Farm Fresh Quality</p>
                  <p className="text-[10px] text-[#718078]">From farm to home</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 text-[#C98A24] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F5F3EC]">Trusted by Families</p>
                  <p className="text-[10px] text-[#718078]">Loved by 5k+ customers</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-[#C98A24] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F5F3EC]">Ethically Sourced</p>
                  <p className="text-[10px] text-[#718078]">Cows cared with love</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. OUR FINEST DAIRY (ONLY 4 PRODUCTS MAX) */}
      <section className="py-16 sm:py-24 bg-[#061A13] text-[#F5F3EC] border-t border-white/10">
        <div className="container-main">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C98A24]">OUR FINEST DAIRY</span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-[#F5F3EC] mt-1">
                Handpicked Goodness for <span className="text-[#C98A24]">Your Family</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#AAB8B0] mt-1.5 max-w-lg">
                Discover a carefully selected range of our farm-fresh organic dairy products.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-white/20 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F] hover:text-[#C98A24] font-bold text-xs uppercase tracking-wider rounded-xl h-11 px-5"
              asChild
            >
              <Link to="/products">
                View All Products →
              </Link>
            </Button>
          </div>

          {/* 4 PRODUCT GRID (2 Columns on Mobile, 4 Columns on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {homepageProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group bg-[#0B2118] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-[#C98A24]/40 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image Frame */}
                <div className="h-36 sm:h-52 bg-[#F4EFE5] overflow-hidden p-2.5 sm:p-4 relative flex items-center justify-center">
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#0B2118] text-[#C98A24] text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-white/10 z-10">
                    FARM FRESH
                  </span>
                  <img
                    src={product.image}
                    alt={product.name}
                    width="300"
                    height="225"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full !object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
                  <div>
                    <h3 className="font-extrabold text-[#F5F3EC] text-xs sm:text-base group-hover:text-[#C98A24] transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#9AAFA4] mt-0.5 sm:mt-1 line-clamp-2 leading-tight sm:leading-relaxed">
                      {product.description || "Farm-fresh dairy product delivered straight from our farm."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/10">
                    <div>
                      <span className="text-[9px] sm:text-xs text-[#9AAFA4] font-medium block sm:inline">Price</span>
                      <p className="font-black text-[#C98A24] text-xs sm:text-lg leading-none mt-0.5">
                        ₹{product.price} <span className="text-[9px] sm:text-xs font-normal text-[#9AAFA4]">/ {product.unitType || 'pack'}</span>
                      </p>
                    </div>

                    <Button
                      size="icon"
                      aria-label={`Add ${product.name} to cart`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({
                          productId: product.id,
                          name: product.name,
                          selectedWeight: product.selectedWeight || 1,
                          calculatedPrice: product.price,
                          quantity: 1,
                          image: product.image,
                          unitType: product.unitType || 'unit'
                        });
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#10291F] hover:bg-[#C98A24] text-[#F5F3EC] hover:text-[#061A13] border border-white/10 transition-colors shrink-0"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 5. WHY CHOOSE MM DAIRY */}
      <section className="py-16 sm:py-24 bg-[#08251A] text-[#F5F3EC] border-t border-white/10">
        <div className="container-main text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C98A24]">WHY CHOOSE MM DAIRY</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-[#F5F3EC] mt-1 mb-12">
            Goodness <span className="text-[#C98A24]">You Can Trust</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-[#0B2118] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-extrabold text-[#F5F3EC] text-xs sm:text-base">Hygienic & Safe</h3>
              <p className="text-[10px] sm:text-xs text-[#9AAFA4] leading-relaxed">
                Modern methods with traditional values ensuring zero contamination.
              </p>
            </div>

            <div className="bg-[#0B2118] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-extrabold text-[#F5F3EC] text-xs sm:text-base">Sustainable Farming</h3>
              <p className="text-[10px] sm:text-xs text-[#9AAFA4] leading-relaxed">
                Eco-friendly practices for a healthier environment and better tomorrow.
              </p>
            </div>

            <div className="bg-[#0B2118] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-extrabold text-[#F5F3EC] text-xs sm:text-base">Unmatched Quality</h3>
              <p className="text-[10px] sm:text-xs text-[#9AAFA4] leading-relaxed">
                Every single drop meets our highest standards of freshness and taste.
              </p>
            </div>

            <div className="bg-[#0B2118] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-extrabold text-[#F5F3EC] text-xs sm:text-base">From Our Farm</h3>
              <p className="text-[10px] sm:text-xs text-[#9AAFA4] leading-relaxed">
                Freshness delivered directly from our own farm straight to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THE PROCESS OF PURITY (DYNAMIC CRAFT VIDEOS) */}
      <MakingOfSection />

      {/* 7. FINAL CTA SECTION */}
      <section className="py-16 sm:py-24 bg-[#061A13] text-[#F5F3EC] border-t border-white/10">
        <div className="container-main">
          <div className="bg-[#0B2118] border border-white/10 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C98A24]/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C98A24]">FRESHNESS DELIVERED DAILY</span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F3EC]">
                Ready to Taste <span className="text-[#C98A24]">the Difference?</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#9AAFA4] max-w-xl mx-auto leading-relaxed">
                Order now and experience farm-fresh dairy delivered to your doorstep every morning.
              </p>

              <div className="pt-4 flex justify-center">
                <Button size="xl" className="w-full sm:w-80 h-14 sm:h-16 px-6 sm:px-10 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-xs sm:text-base uppercase tracking-wider rounded-2xl shadow-2xl border border-[#C98A24] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2" asChild>
                  <Link to="/products">
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
