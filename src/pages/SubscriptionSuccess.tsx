import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Calendar, Clock, Home, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const SubscriptionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, product, totalAmount, totalDeliveries } = location.state || {};

  useEffect(() => {
    if (!product || !config) {
      navigate("/");
      return;
    }

    // Play Success Sound
    const isMuted = localStorage.getItem("muteSuccessSound") === "true";
    if (!isMuted) {
      const audio = new Audio("/sounds/success.mp3");
      audio.volume = 0.8; // Slightly softer than primary payment success
      audio.preload = "auto";

      const playAudio = () => {
        audio.play()
          .catch((err) => console.warn("Autoplay blocked. Sound pending interaction."));
      };

      const timeout = setTimeout(playAudio, 0);
      window.addEventListener("click", playAudio, { once: true });

      return () => {
        clearTimeout(timeout);
        window.removeEventListener("click", playAudio);
      };
    }
  }, [product, config, navigate]);

  if (!product || !config) return null;

  return (
    <Layout>
      <section className="bg-slate-50 py-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-600/40 rotate-12">
               <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
              Payment Successful 🎉
            </h1>
            <p className="text-xl text-slate-500 font-bold max-w-xl mx-auto leading-tight italic uppercase tracking-tighter">
              Your subscription for {product.name} is now locked & active.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left: Product Info */}
            <div className="md:col-span-7 bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                 <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100">
                    <img src={product.image} alt="" className="w-full h-full object-contain" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{product.name}</h2>
                    <p className="text-emerald-600 font-black uppercase tracking-widest text-xs mt-1">
                       PREPAID SUBSCRIPTION • {config.quantity}x {config.weight >= 1000 ? `${config.weight/1000}L` : `${config.weight}ml`}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Frequency</h4>
                    <p className="text-xl font-black text-slate-800 capitalize leading-none">{config.frequency}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Delivery Time</h4>
                    <p className="text-xl font-black text-slate-800 capitalize leading-none">{config.timing}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Start Date</h4>
                    <p className="font-bold text-slate-700">{format(new Date(config.startDate), "dd MMMM, yyyy")}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Duration</h4>
                    <p className="font-bold text-slate-700">
                       {config.endDate ? `Until ${format(new Date(config.endDate), "dd MMM, yyyy")}` : 'Until Cancelled'}
                    </p>
                 </div>
              </div>

              <div className="mt-10 p-6 rounded-3xl bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Paid (Prepaid)</p>
                    <p className="text-3xl font-black italic">₹{totalAmount}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Drops</p>
                    <p className="text-2xl font-black opacity-80">{totalDeliveries} Deliveries</p>
                 </div>
              </div>
            </div>

            {/* Right: Operational Info & CTAs */}
            <div className="md:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
               <div className="bg-white rounded-[40px] p-8 shadow-lg border border-slate-100 flex flex-col gap-6">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Starts Immediately</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1">Your first delivery is scheduled for {format(new Date(config.startDate), "dd MMM")}.</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Zero Hassle Delivery</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1">No OTP or Cash required. Rider will drop the items and update status.</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Automatic Fulfillment</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1">Manage, pause, or resume anytime from your dashboard.</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                    onClick={() => navigate('/orders')}
                  >
                    Go to Dashboard <ArrowRight className="w-5 h-5 ml-3" />
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full h-16 bg-white border-2 border-slate-100 text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all"
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
