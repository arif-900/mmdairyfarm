import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <Layout>
      <section className="section-padding min-h-[70vh] flex items-center">
        <div className="container-main text-center max-w-md mx-auto animate-scale-in">
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
