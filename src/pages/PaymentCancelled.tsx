import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      // Safely cancel the pending order. This triggers a database function
      // that releases any locked reward coins back to the user's profile.
      supabase.rpc('cancel_my_pending_order', { p_order_id: orderId })
        .then(({ data, error }) => {
          if (error) console.error("Could not cancel order:", error);
          else if (data) { /* Pending order cancelled */ }
        });
    }
  }, [orderId]);

  return (
    <Layout>
      <section className="bg-[#061A13] min-h-[85vh] flex items-center justify-center p-4 sm:p-6 text-[#F5F3EC]">
        <div className="bg-[#0B2118] border border-white/10 p-8 sm:p-10 rounded-3xl text-center max-w-md w-full shadow-2xl space-y-6">
          <div className="flex justify-start mb-2">
            <CircularBackButton onClick={() => navigate("/products")} className="border-white/10 bg-[#10291F] text-[#F5F3EC]" />
          </div>
          
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-black text-[#F5F3EC] uppercase tracking-tight">
              PAYMENT <span className="text-rose-400">CANCELLED</span>
            </h1>
            <p className="text-xs text-[#AAB8B0] leading-relaxed">
              Your payment was cancelled. Don't worry - no charges were made to your account. You can try again whenever you're ready.
            </p>
          </div>

          {orderId && (
            <p className="text-xs font-bold text-[#AAB8B0]">
              Order Reference: <span className="font-mono text-[#C98A24]">#{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}

          <div className="space-y-3 pt-2">
            <Button size="lg" className="w-full h-14 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] border border-[#C98A24] shadow-xl" asChild>
              <Link to="/order">Try Again</Link>
            </Button>
            <Button size="lg" className="w-full h-14 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] border border-white/20 shadow-xl" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentCancelled;
