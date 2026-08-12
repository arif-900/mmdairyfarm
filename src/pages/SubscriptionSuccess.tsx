import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Calendar, Clock, Home, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import confetti from "canvas-confetti";

const SubscriptionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, product, totalAmount, totalDeliveries } = location.state || {};

  useEffect(() => {
    if (!product || !config) {
      navigate("/");
      return;
    }

    // Fire Confetti (Celebration!)
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
  }, [product, config, navigate]);

  if (!product || !config) return null;

  return (
    <Layout>
      <section className="bg-[#061A13] py-12 min-h-screen text-[#F5F3EC]">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="text-center space-y-4 mb-10">
            <div className="w-20 h-20 bg-[#10291F] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#C98A24] shadow-2xl">
               <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#F5F3EC] tracking-tight uppercase">
              PAYMENT <span className="text-[#C98A24]">SUCCESSFUL</span> 🎉
            </h1>
            <p className="text-sm text-[#AAB8B0] font-bold max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
              Your subscription for {product.name} is now active & scheduled.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-start">
            {/* Left: Product Info */}
            <div className="md:col-span-7 bg-[#0B2118] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 text-[#F5F3EC]">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                 <div className="w-20 h-20 rounded-2xl bg-[#F1EEE7] flex items-center justify-center p-2 border border-white/10 shrink-0">
                    <img src={product.image} alt="" className="w-full h-full object-contain" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-[#F5F3EC] tracking-tight">{product.name}</h2>
                    <p className="text-[#C98A24] font-bold uppercase tracking-wider text-xs mt-1">
                       PREPAID SUBSCRIPTION • {config.quantity}x {config.weight >= 1000 ? `${config.weight/1000}L` : `${config.weight}ml`}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Frequency</h4>
                    <p className="text-lg font-bold text-[#F5F3EC] capitalize">{config.frequency}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Delivery Time</h4>
                    <p className="text-lg font-bold text-[#F5F3EC] capitalize">{config.timing}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Start Date</h4>
                    <p className="font-bold text-[#F5F3EC]">{format(new Date(config.startDate), "dd MMMM, yyyy")}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Duration</h4>
                    <p className="font-bold text-[#F5F3EC]">
                       {config.endDate ? `Until ${format(new Date(config.endDate), "dd MMM, yyyy")}` : 'Until Cancelled'}
                    </p>
                 </div>
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[#061A13] border border-white/10 text-[#F5F3EC] flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Total Paid (Prepaid)</p>
                    <p className="text-2xl font-black text-[#C98A24]">₹{totalAmount}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] mb-1">Target Drops</p>
                    <p className="text-xl font-bold text-[#F5F3EC]">{totalDeliveries} Deliveries</p>
                 </div>
              </div>
            </div>

            {/* Right: Operational Info & CTAs */}
            <div className="md:col-span-5 space-y-6">
               <div className="bg-[#0B2118] rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5 text-[#F5F3EC]">
                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 text-[#C98A24] flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-[#F5F3EC] text-xs uppercase tracking-wider">Starts Immediately</h4>
                        <p className="text-[11px] font-medium text-[#AAB8B0] mt-0.5">First drop on {format(new Date(config.startDate), "dd MMM")}.</p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 text-[#C98A24] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-[#F5F3EC] text-xs uppercase tracking-wider">Zero Hassle Delivery</h4>
                        <p className="text-[11px] font-medium text-[#AAB8B0] mt-0.5">No OTP required. Rider will drop and notify.</p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-xl bg-[#10291F] border border-white/10 text-[#C98A24] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-[#F5F3EC] text-xs uppercase tracking-wider">Automatic Fulfillment</h4>
                        <p className="text-[11px] font-medium text-[#AAB8B0] mt-0.5">Pause or manage anytime from your dashboard.</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-14 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl transition-all"
                    onClick={() => navigate('/orders')}
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    className="w-full h-14 bg-[#10291F] text-[#F5F3EC] border border-white/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#164431] transition-all"
                    onClick={() => navigate('/')}
                  >
                    <Home className="w-4 h-4 mr-2" /> Back to Home
                  </Button>
               </div>
            </div>
          </div>

        </div>
      </section>
    </Layout>
  );
};

export default SubscriptionSuccess;
