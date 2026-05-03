import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useStoreProducts } from "@/data/products";
import heroPoster from "@/assets/hero-farm.jpg";
import TextType from "@/components/ui/TextType";
import { Suspense, lazy } from "react";
// Optimized Hero & Smoothness Refactor - 2026-05-03
import { supabase } from "../integrations/supabase/client";
import CircularGallery from "../components/ui/CircularGallery";

const MakingOfSection = lazy(() => import("@/components/home/MakingOfSection").then(m => ({ default: m.MakingOfSection })));

const Index = () => {
  const [promo, setPromo] = useState<{ isActive: boolean, title: string, description: string, promoCode: string } | null>(null);
  const { products, loading } = useStoreProducts();

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "promo_banner")
          .maybeSingle();

        if (error) {
          console.error("Error fetching promo_banner:", error);
          return;
        }

        if (data && data.value) {
          let parsed = data.value;
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) { }
          }
          if (parsed && typeof parsed === 'object') {
            if (parsed.isActive) {
              setPromo(parsed);
            } else {
              setPromo(null);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error in fetchPromo:", err);
      }
    };

    fetchPromo();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('promo-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.promo_banner'
        },
        () => fetchPromo()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Layout>
      {/* Promo Banner */}
      {promo && (
        <div className="sticky top-20 z-40 bg-gradient-to-r from-forest-dark via-primary to-forest-dark py-8 px-6 text-white text-base md:text-lg border-b border-golden/20 shadow-xl overflow-hidden">
          {/* Sparkle background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[bg-pan_3s_linear_infinite]" />

          <div className="container-main mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-golden/20 p-3 rounded-full hidden sm:block animate-bounce shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                <Tag className="w-6 h-6 text-golden" />
              </div>
              <div>
                <span className="font-display font-black text-xl md:text-2xl text-golden mr-3 animate-pulse">{promo.title}</span>
                <span className="opacity-90">{promo.description}</span>
              </div>
            </div>
            {promo.promoCode && (
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer px-6 py-3 rounded-xl flex-shrink-0 border border-white/20 whitespace-nowrap shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-pulse hover:animate-none">
                <span className="opacity-80 text-sm md:text-base uppercase tracking-wider font-bold">Use Code</span>
                <span className="font-mono font-black tracking-widest text-lg md:text-xl text-yellow-300">{promo.promoCode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden bg-forest-dark">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={heroPoster}
            className="w-full h-full object-cover blur-[1.5px] scale-105 opacity-0 transition-opacity duration-1000"
            onLoadedData={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <source src="/farm.mp4" type="video/mp4" />
          </video>
          {/* Fallback overlay in case video fails or is loading */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 container-main section-padding">
          <div className="mb-10 min-h-[50px] md:min-h-[90px] flex items-center">
            <TextType
              text="WELCOME TO MMVALI DAIRY FARM"
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight uppercase"
              typingSpeed={70}
              pauseDuration={3000}
              cursorCharacter="_"
              cursorClassName="text-golden ml-2"
              showCursor={true}
            />
          </div>

          <div className="max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Pure Dairy Goodness,{" "}
              <span className="text-golden">Fresh From Our Farm</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
              Experience the excellence of premium, farm-to-doorstep dairy. We are dedicated to providing the purest natural nutrition, rooted in a commitment to quality that spans generations.
            </p>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      {!loading && products.length > 0 && (
        <section className="py-20 bg-cream/30 overflow-hidden">
          <div className="container-main px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>ARTISAN EXCELLENCE</span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-forest">
                  The Farm's <span className="text-golden">Finest Selection</span>
                </h2>
                <p className="text-lg text-earth/80 mb-8 leading-relaxed max-w-xl">
                  Discover our carefully curated collection of farm-to-table dairy.
                  Handcrafted using time-honored traditions to ensure unparalleled
                  purity and exceptional flavor in every drop.
                </p>
                <div className="flex gap-4">
                  <Button variant="accent" size="xl" className="w-full md:w-64" asChild>
                    <Link to="/products">
                      Discover The Collection
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-[500px]">
                <CircularGallery
                  items={products.map(p => ({
                    image: p.image || "",
                    text: p.name
                  }))}
                  bend={3}
                  textColor="#d4af37"
                  borderRadius={0.05}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Making of Section */}
      <Suspense fallback={<div className="h-96 bg-cream/30 animate-pulse" />}>
        <MakingOfSection />
      </Suspense>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-main text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Order now and experience farm-fresh dairy delivered to your doorstep every morning.
          </p>
          <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
            <Button variant="accent" size="xl" className="w-full md:w-64" asChild>
              <Link to="/products">
                View Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button className="bg-[#ff6b00] hover:bg-[#e66000] text-white border-none shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 w-full md:w-64" size="xl" asChild>
              <Link to="/auth">Sign in <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
