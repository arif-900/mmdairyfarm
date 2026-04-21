import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Truck, ShoppingBag, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
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
    
    console.log("Success Sound Debug:", { isMuted, orderId });

    if (!isMuted) {
      // Pre-load audio object to reduce latency
      const audio = new Audio("/sounds/success.mp3");
      audio.volume = 1.0;
      audio.preload = "auto";

      const playAudio = () => {
        audio.play()
          .then(() => {
            console.log("Success sound played successfully!");
            window.removeEventListener("click", playAudio);
          })
          .catch((err) => {
            console.warn("Autoplay blocked. Sound will play on next click.");
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
      <section className="min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-slate-50/50 to-white px-4 py-12">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md mx-auto w-full text-center space-y-8"
        >

          {/* Success Icon Animation */}
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.1 
              }}
              className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-2xl shadow-primary/30"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulse Glow Background */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.4, 1.2], opacity: [0.5, 0.2, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
            />
            {/* Second pulse Glow effect */}
             <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.6, 1.3], opacity: [0.4, 0.1, 0] }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5
              }}
              className="absolute inset-0 rounded-full bg-primary/10 pointer-events-none"
            />
          </div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-2 px-4">
            <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Order Confirmed!</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[320px] mx-auto">
              Thank you! Our farm team is already harvesting your fresh supply.
            </p>
          </motion.div>

          {/* Order Info Card */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="overflow-hidden px-2 sm:px-0"
          >
            {orderId && (
              <div className="bg-white border border-slate-200/60 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Receipt ID</p>
                    <p className="font-mono font-black text-slate-800 text-lg sm:text-xl tracking-wider">
                      #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Delivery Promise Box */}
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 sm:p-5 text-left space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arriving At</p>
                        <p className="font-black text-slate-900 text-xs sm:text-sm">{getDeliveryLabel()}</p>
                      </div>
                    </div>
                    {expectedDate && (
                      <div className="flex items-center gap-3 pt-3 border-t border-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 italic">
                          ETA: <span className="text-primary font-black not-italic">{format(expectedDate, "EEEE, dd MMM")}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-0">
            <Button
              size="lg"
              className="rounded-[18px] sm:rounded-[20px] h-14 font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
              asChild
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/products" className="flex items-center justify-center w-full h-full">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </motion.div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-[18px] sm:rounded-[20px] h-14 font-black text-xs uppercase tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-all"
              asChild
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/" className="flex items-center justify-center w-full h-full">Home</Link>
              </motion.div>
            </Button>
          </motion.div>

          {/* Support Link */}
          <motion.p variants={itemVariants} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 sm:pt-4 px-4">
            Need help? <Link to="/support" className="text-primary hover:underline">Contact Support</Link>
          </motion.p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
