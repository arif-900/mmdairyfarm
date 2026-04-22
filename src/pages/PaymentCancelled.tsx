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
          else if (data) console.log("Pending order cancelled and coins refunded.");
        });
    }
  }, [orderId]);

  return (
    <Layout>
      <section className="section-padding min-h-[70vh] flex items-center">
        <div className="container-main text-center max-w-md mx-auto animate-scale-in">
          <div className="flex justify-center sm:justify-start mb-6">
            <CircularBackButton onClick={() => navigate("/products")} />
          </div>
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground mb-8">
            Your payment was cancelled. Don't worry - no charges were made to your account.
            You can try again whenever you're ready.
          </p>

          {orderId && (
            <p className="text-sm text-muted-foreground mb-6">
              Order Reference: <span className="font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}

          <div className="space-y-3">
            <Button variant="accent" size="lg" className="w-full" asChild>
              <Link to="/order">Try Again</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentCancelled;
