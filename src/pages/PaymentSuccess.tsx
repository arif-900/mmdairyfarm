import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Truck, ShoppingBag, Clock, Calendar, Home } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => {
      if (data) setOrder(data);
    });

    // Fire Confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Play Success Sound
    const isMuted = localStorage.getItem("muteSuccessSound") === "true";
    


    if (!isMuted) {
      // Pre-load audio object to reduce latency
      const audio = new Audio("/sounds/success.mp3");
      audio.volume = 1.0;
      audio.preload = "auto";

      const playAudio = () => {
        audio.play()
          .then(() => {

            window.removeEventListener("click", playAudio);
          })
          .catch((err) => {

          });
      };

      // Play as soon as possible
      const timeout = setTimeout(playAudio, 0);

      // Backup click listener
      window.addEventListener("click", playAudio, { once: true });

      return () => {
        clearTimeout(timeout);
        window.removeEventListener("click", playAudio);
      };
    }

    return () => clearInterval(interval);
  }, [orderId]);

  const expectedDate = order?.expected_delivery_date ? new Date(order.expected_delivery_date) : null;
  const daysLeft = expectedDate ? Math.max(0, differenceInDays(expectedDate, new Date())) : null;

  const getDeliveryLabel = () => {
    if (daysLeft === null) return "Your order is being prepared";
    if (daysLeft === 0) return "Your order arrives today! 🎉";
    return `Your order arrives in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <Layout>
      <section className="bg-[#061A13] min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-body text-[#F5F3EC]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full text-center space-y-6 sm:space-y-8"
        >
          {/* Animated Checkmark Icon with Ambient Gold Glow */}
          <div className="relative flex justify-center items-center py-4">
            <div className="absolute w-28 h-28 bg-[#C98A24]/20 rounded-full blur-2xl animate-pulse" />
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.1 
              }}
              className="relative z-10 w-22 h-22 rounded-full bg-[#10291F] border-2 border-[#C98A24]/40 flex items-center justify-center text-[#C98A24] shadow-[0_0_40px_rgba(201,138,36,0.35)]"
            >
              <CheckCircle className="w-11 h-11 text-[#C98A24]" />
            </motion.div>
          </div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-2 px-4">
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#F5F3EC] tracking-tight leading-tight">
              ORDER <span className="text-[#C98A24]">CONFIRMED!</span>
            </h1>
            <p className="text-[#AAB8B0] text-sm leading-relaxed max-w-[340px] mx-auto font-medium">
              Thank you! Our farm team is already harvesting your fresh supply.
            </p>
          </motion.div>

          {/* Order Info Card */}
          <motion.div 
            variants={itemVariants}
            className="overflow-hidden px-2 sm:px-0"
          >
            {orderId && (
              <div className="bg-[#0B2118] border border-white/10 border-t-2 border-t-[#C98A24] rounded-3xl p-6 shadow-2xl">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#718078] mb-1">Receipt ID</p>
                    <p className="font-mono font-black text-[#C98A24] text-xl sm:text-2xl tracking-wider">
                      #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Delivery Promise Box */}
                  <div className="bg-[#10291F] border border-white/10 rounded-2xl p-4 sm:p-5 text-left space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#0B2118] border border-white/10 flex items-center justify-center shrink-0 text-[#C98A24] shadow-md">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#718078]">Arriving At</p>
                        <p className="font-black text-[#F5F3EC] text-sm">{getDeliveryLabel()}</p>
                      </div>
                    </div>
                    {expectedDate && (
                      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                        <Calendar className="w-4 h-4 text-[#C98A24]" />
                        <span className="text-xs font-bold text-[#AAB8B0] italic">
                          ETA: <span className="text-[#C98A24] font-black not-italic">{format(expectedDate, "EEEE, dd MMM")}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Premium High-Impact Actions */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3.5 w-full px-2 sm:px-0 pt-3">
            <Button
              size="lg"
              className="w-full rounded-2xl h-15 sm:h-16 font-extrabold text-sm sm:text-base uppercase tracking-widest bg-gradient-to-r from-[#D9A441] via-[#C98A24] to-[#B3781D] text-[#061A13] border border-[#F5D79E]/40 shadow-[0_8px_25px_rgba(201,138,36,0.4)] hover:shadow-[0_12px_32px_rgba(201,138,36,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
              asChild
            >
              <Link to="/products" className="flex items-center justify-center w-full h-full gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#061A13] shrink-0" />
                <span>Continue Shopping</span>
              </Link>
            </Button>
            <Button
              size="lg"
              className="w-full rounded-2xl h-15 sm:h-16 font-extrabold text-sm sm:text-base uppercase tracking-widest bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] hover:text-[#C98A24] border-2 border-white/20 hover:border-[#C98A24]/50 shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
              asChild
            >
              <Link to="/" className="flex items-center justify-center w-full h-full gap-2.5">
                <Home className="w-5 h-5 text-[#C98A24] shrink-0" />
                <span>Home</span>
              </Link>
            </Button>
          </motion.div>

          {/* Support Link */}
          <motion.p variants={itemVariants} className="text-[10px] font-bold text-[#718078] uppercase tracking-widest pt-2 sm:pt-4 px-4">
            Need help? <Link to="/contact" className="text-[#C98A24] hover:underline">Contact Support</Link>
          </motion.p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
