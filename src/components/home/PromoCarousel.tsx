import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useHomepageBanners, PromoBannerItem } from "@/hooks/useHomepageBanners";

export function PromoCarousel() {
  const { activeBanners, isLoading } = useHomepageBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Mobile touch swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-decode active banner image for zero-flicker render
  useEffect(() => {
    if (activeBanners.length > 0 && activeBanners[0]?.imageUrl) {
      const img = new Image();
      img.src = activeBanners[0].imageUrl;
    }
  }, [activeBanners]);

  // Keep currentIndex within valid bounds if activeBanners changes
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Auto-slide effect (every 5.5 seconds)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isPaused]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  }, [activeBanners.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeBanners.length <= 1) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBanners.length, handlePrev, handleNext]);

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
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  // If loading without cached data or 0 active banners exist -> Hide section cleanly
  if (isLoading && activeBanners.length === 0) {
    return null;
  }

  if (activeBanners.length === 0) {
    return null;
  }

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
    <section className="py-3 sm:py-5 lg:py-6 bg-[#061A13] border-b border-white/10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          role="region"
          aria-label="Promotional Banners Showcase"
          className="relative group rounded-2xl sm:rounded-3xl border border-[#C98A24]/40 bg-[#0B2118] overflow-hidden shadow-2xl shadow-black/80 transition-all duration-300"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* VIEWPORT: Image fits 100% flush, 0ms instant render */}
          <div className="relative w-full overflow-hidden flex items-center justify-center min-h-[160px] sm:min-h-[260px] lg:min-h-[360px]">
            {activeBanners.map((banner, index) => {
              const isActive = index === currentIndex;
              const isFailed = failedImages[banner.id];

              return (
                <div
                  key={banner.id || index}
                  className={`w-full transition-all duration-500 ease-in-out flex items-center justify-center ${
                    isActive
                      ? "opacity-100 relative z-10 pointer-events-auto"
                      : "opacity-0 absolute inset-0 z-0 pointer-events-none"
                  }`}
                >
                  {isFailed ? (
                    <div className="w-full py-12 px-6 flex flex-col items-center justify-center bg-[#0B2118] text-[#9AAFA4] text-center space-y-2">
                      <ImageOff className="w-8 h-8 text-[#C98A24]" />
                      <p className="text-xs font-bold text-[#F5F3EC]">{banner.title || "MM Dairy Special Offer"}</p>
                      <p className="text-[10px] text-[#9AAFA4]">Pure Dairy Goodness • Direct From Our Farm</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleBannerClick(banner)}
                      className={`w-full flex items-center justify-center ${
                        banner.targetUrl ? "cursor-pointer" : ""
                      }`}
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || "MM Dairy Farm Special Offer"}
                        width="1400"
                        height="600"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchpriority={index === 0 ? "high" : "low"}
                        decoding="async"
                        onError={() => handleImageError(banner.id)}
                        className="w-full h-auto block object-cover rounded-2xl sm:rounded-3xl"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CAROUSEL CONTROLS */}
          {activeBanners.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#061A13]/85 backdrop-blur-md border border-white/20 text-[#F5F3EC] hover:bg-[#C98A24] hover:text-[#061A13] hover:border-[#C98A24] flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#061A13]/85 backdrop-blur-md border border-white/20 text-[#F5F3EC] hover:bg-[#C98A24] hover:text-[#061A13] hover:border-[#C98A24] flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Bottom Center Indicator Dots */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-lg">
                {activeBanners.map((_, dotIndex) => {
                  const isCurrent = dotIndex === currentIndex;
                  return (
                    <button
                      key={dotIndex}
                      type="button"
                      onClick={() => setCurrentIndex(dotIndex)}
                      aria-label={`Go to slide ${dotIndex + 1}`}
                      aria-current={isCurrent ? "true" : "false"}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? "w-5 sm:w-6 bg-[#C98A24]"
                          : "w-2 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default PromoCarousel;
