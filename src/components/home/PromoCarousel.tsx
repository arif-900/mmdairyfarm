import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PromoBannerItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export function PromoCarousel() {
  const [banners, setBanners] = useState<PromoBannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // Touch swipe refs for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      // 1. Try fetching from dedicated table homepage_promotional_banners
      const { data: dbData, error: dbErr } = await (supabase as any)
        .from("homepage_promotional_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!dbErr && dbData && dbData.length > 0) {
        const mapped: PromoBannerItem[] = dbData.map((item: any) => ({
          id: item.id,
          title: item.title,
          imageUrl: item.image_url || item.imageUrl,
          targetUrl: item.target_url || item.targetUrl,
          isActive: item.is_active ?? item.isActive,
          displayOrder: item.display_order ?? item.displayOrder ?? 1,
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        }));
        setBanners(mapped);
        return;
      }

      // 2. Fallback to app_settings key 'homepage_banners'
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "homepage_banners")
        .maybeSingle();

      if (error) {
        console.error("Error fetching homepage_banners:", error);
        return;
      }

      if (data && data.value) {
        let parsed = data.value;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            console.error("Error parsing homepage_banners JSON:", e);
          }
        }

        if (Array.isArray(parsed)) {
          const activeOnly = parsed
            .filter((item: PromoBannerItem) => item && item.isActive && item.imageUrl)
            .sort((a: PromoBannerItem, b: PromoBannerItem) => (a.displayOrder || 0) - (b.displayOrder || 0));

          setBanners(activeOnly);
        } else {
          setBanners([]);
        }
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchBanners:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();

    // Subscribe to realtime updates on app_settings
    const channel = supabase
      .channel("homepage-banners-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.homepage_banners",
        },
        () => fetchBanners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBanners]);

  // Auto-slide effect (every 5.5 seconds)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left -> Next slide
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Prev slide
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // 0 Active Banners -> Render nothing
  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = (banner: PromoBannerItem) => {
    if (banner.targetUrl) {
      if (banner.targetUrl.startsWith("http")) {
        window.open(banner.targetUrl, "_blank", "noopener,noreferrer");
      } else {
        navigate(banner.targetUrl);
      }
    }
  };

  return (
    <section className="py-4 sm:py-6 bg-[#061A13] border-b border-white/10 overflow-hidden">
      <div className="container-main">
        {/* CAROUSEL WRAPPER */}
        <div
          className="relative group rounded-2xl sm:rounded-3xl border border-[#C98A24]/30 bg-[#0B2118] overflow-hidden shadow-2xl transition-all duration-300"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* BANNER DISPLAY AREA */}
          <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] md:aspect-[16/5] bg-[#08251A] overflow-hidden flex items-center justify-center">
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={banner.id || index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${
                    isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <div
                    onClick={() => handleBannerClick(banner)}
                    className={`w-full h-full flex items-center justify-center ${
                      banner.targetUrl ? "cursor-pointer" : ""
                    }`}
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "MM Dairy Promotion"}
                      width="1440"
                      height="500"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchpriority={index === 0 ? "high" : "low"}
                      decoding="async"
                      className="w-full h-full object-cover sm:object-contain object-center transition-transform duration-500 hover:scale-[1.01]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* CAROUSEL NAVIGATION CONTROLS (Rendered only if 2+ banners) */}
          {banners.length > 1 && (
            <>
              {/* Previous Arrow Button */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous promotional slide"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#061A13]/85 backdrop-blur-md border border-[#C98A24]/40 text-[#F5F3EC] hover:bg-[#C98A24] hover:text-[#061A13] hover:border-[#C98A24] flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Next Arrow Button */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next promotional slide"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#061A13]/85 backdrop-blur-md border border-[#C98A24]/40 text-[#F5F3EC] hover:bg-[#C98A24] hover:text-[#061A13] hover:border-[#C98A24] flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Pagination Dots */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                {banners.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={() => setCurrentIndex(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dotIndex === currentIndex
                        ? "w-6 bg-[#C98A24]"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default PromoCarousel;
