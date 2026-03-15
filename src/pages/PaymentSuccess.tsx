import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <Layout>
      <section className="section-padding min-h-[70vh] flex items-center">
        <div className="container-main text-center max-w-md mx-auto animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mb-4">
            Thank you for your order! We've received your payment and will start
            processing your order right away.
          </p>
          
          {orderId && (
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-semibold text-foreground text-lg">
                {orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          <div className="bg-accent/10 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You'll receive an email confirmation shortly</li>
              <li>• Our team will prepare your fresh products</li>
              <li>• Delivery within 24 hours for one-time orders</li>
              <li>• Daily subscriptions start from tomorrow morning</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button variant="accent" size="lg" className="w-full" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
