import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Truck, ShoppingBag, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => {
      if (data) setOrder(data);
    });
  }, [orderId]);

  const expectedDate = order?.expected_delivery_date ? new Date(order.expected_delivery_date) : null;
  const deliveryDays = order?.order_delivery_days ?? null;
  const daysLeft = expectedDate ? Math.max(0, differenceInDays(expectedDate, new Date())) : null;

  const getDeliveryLabel = () => {
    if (daysLeft === null) return "Your order is being prepared";
    if (daysLeft === 0) return "Your order arrives today! 🎉";
    return `Your order arrives in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  };

  return (
    <Layout>
      <section className="min-h-[80vh] flex items-center bg-gradient-to-b from-slate-50 to-white px-4 py-16">
        <div className="max-w-md mx-auto w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-40 scale-110" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-2xl shadow-primary/30">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Thank you! We've received your order and our farm team is already preparing your fresh products.
            </p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Order Reference</p>
              <p className="font-mono font-black text-slate-800 text-lg tracking-wider">
                #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Delivery Promise */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Promise</p>
                <p className="font-black text-slate-900 text-sm">{getDeliveryLabel()}</p>
              </div>
            </div>
            {expectedDate && (
              <div className="flex items-center gap-3 pt-2 border-t border-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-600">
                  Expected by <span className="text-primary font-black">{format(expectedDate, "EEEE, dd MMM yyyy")}</span>
                </span>
              </div>
            )}
          </div>



          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              size="lg"
              className="rounded-2xl h-14 font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
              asChild
            >
              <Link to="/products">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop More
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl h-14 font-black text-xs uppercase tracking-widest border-2 hover:bg-slate-50"
              asChild
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
