import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Truck, Sparkles, X, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

interface FreeDeliveryCelebrationProps {
  isFreeDelivery: boolean;
  reason?: "ORDER_VALUE" | "DISTANCE" | null;
  distanceKm?: number | null;
  className?: string;
  onClose?: () => void;
}

export const FreeDeliveryCelebration: React.FC<FreeDeliveryCelebrationProps> = ({
  isFreeDelivery,
  reason,
  distanceKm,
  className = "",
  onClose,
}) => {
  const wasEligibleRef = useRef<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Detect reduced motion user preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Trigger celebration ONLY when transitioning from false -> true
    if (isFreeDelivery && !wasEligibleRef.current) {
      setIsOpen(true);
      wasEligibleRef.current = true;

      if (!prefersReducedMotion) {
        // Fire multi-layered premium brand confetti burst
        try {
          confetti({
            particleCount: 65,
            spread: 70,
            origin: { y: 0.45 },
            colors: ["#3BC77B", "#C98A24", "#F5F3EC", "#0B2118", "#10291F"],
            disableForReducedMotion: true,
            scalar: 1.1,
            ticks: 200,
          });

          // Second subtle sparkle burst after 250ms
          setTimeout(() => {
            confetti({
              particleCount: 35,
              angle: 60,
              spread: 55,
              origin: { x: 0.2, y: 0.5 },
              colors: ["#C98A24", "#3BC77B", "#FFFFFF"],
              scalar: 0.9,
            });
            confetti({
              particleCount: 35,
              angle: 120,
              spread: 55,
              origin: { x: 0.8, y: 0.5 },
              colors: ["#C98A24", "#3BC77B", "#FFFFFF"],
              scalar: 0.9,
            });
          }, 250);
        } catch (e) {
          console.error("Confetti trigger error:", e);
        }
      }

      // Auto-dismiss modal after 3.2 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
        if (onClose) onClose();
      }, 3200);

      return () => clearTimeout(timer);
    } else if (!isFreeDelivery) {
      // Reset transition lock when user removes item or changes to non-free area
      wasEligibleRef.current = false;
      setIsOpen(false);
    }
  }, [isFreeDelivery, onClose]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div 
        className={`relative w-full max-w-[480px] rounded-3xl bg-[#0B2118] border-2 border-[#3BC77B]/40 p-6 sm:p-8 shadow-2xl shadow-[#3BC77B]/20 text-[#F5F3EC] animate-in zoom-in-90 fade-in duration-300 overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient backdrops */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#3BC77B]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#C98A24]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close icon button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#10291F] border border-white/10 text-[#AAB8B0] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close celebration"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Central Content Column */}
        <div className="flex flex-col items-center text-center space-y-4 relative z-10 pt-2">
          
          {/* Animated Large Checkmark Badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#3BC77B]/20 border-2 border-[#3BC77B] flex items-center justify-center text-[#3BC77B] shadow-lg shadow-[#3BC77B]/30 animate-in zoom-in-50 duration-400">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#C98A24] text-[#061A13] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          {/* Title Header */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C98A24]">
              Special Offer
            </span>
            <h2 id="celebration-title" className="text-2xl sm:text-3xl font-black text-[#F5F3EC] tracking-tight uppercase">
              🎉 FREE DELIVERY <span className="text-[#3BC77B]">UNLOCKED!</span>
            </h2>
          </div>

          {/* Reason-Differentiated Supporting Copy */}
          <div className="bg-[#10291F] border border-white/10 rounded-2xl p-4 w-full text-xs text-[#AAB8B0] leading-relaxed">
            {reason === "ORDER_VALUE" ? (
              <p className="font-medium">
                Your order is <span className="text-[#F5F3EC] font-bold">₹1,000 or more</span>. Orders above ₹1,000 always qualify for <span className="text-[#3BC77B] font-bold">FREE Delivery</span>!
              </p>
            ) : reason === "DISTANCE" ? (
              <p className="font-medium">
                You're within our <span className="text-[#3BC77B] font-bold">Free Delivery Zone</span> {distanceKm ? `(${distanceKm.toFixed(1)} km)` : ""}. Delivery charge is completely waived!
              </p>
            ) : (
              <p className="font-medium">
                Congratulations! Your order qualifies for <span className="text-[#3BC77B] font-bold">FREE Delivery</span>.
              </p>
            )}
          </div>

          {/* Transition Visual Pill: ₹50 -> FREE ✓ */}
          <div className="flex items-center gap-3 bg-[#061A13] border border-[#3BC77B]/30 px-5 py-2.5 rounded-full text-xs font-mono font-bold">
            <span className="text-[#AAB8B0] line-through decoration-rose-500 decoration-2">₹50 Fee</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C98A24]" />
            <span className="text-[#3BC77B] font-black text-sm flex items-center gap-1">
              FREE <Truck className="w-4 h-4 text-[#3BC77B]" />
            </span>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleDismiss}
            className="w-full h-12 rounded-2xl bg-[#3BC77B] hover:bg-[#2fb06b] text-[#061A13] font-black text-xs uppercase tracking-wider shadow-xl shadow-[#3BC77B]/20 transition-all hover:scale-[1.02] active:scale-95 mt-2"
          >
            Continue Checkout
          </Button>

        </div>
      </div>
    </div>
  );
};
