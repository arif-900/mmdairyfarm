import Layout from "@/components/layout/Layout";
import { ArrowLeft, RefreshCw, AlertCircle, Clock, ShieldCheck, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Refund = () => {
    const sections = [
        {
            icon: RefreshCw,
            title: "Cancellation Policy",
            content: "Orders for fresh milk and dairy products can be cancelled at any time before the delivery process begins. Since dairy products are perishable, once the delivery agent has left the farm or the product has been dispatched, cancellations may not be possible.",
            list: [
                "Cancellations made 12 hours before delivery: Full refund/No charge.",
                "Cancellations made after dispatch: May incur a delivery fee or no refund for perishable items.",
                "Subscription cancellations: Can be managed via the dashboard at any time."
            ]
        },
        {
            icon: Clock,
            title: "Refund Timeframe",
            content: "If a refund is approved, it will be processed and credited to your original method of payment within 5-7 working days. Please note that bank processing times may vary.",
            list: null
        },
        {
            icon: AlertCircle,
            title: "Damaged or Quality Issues",
            content: "In the unlikely event that you receive a damaged product or have quality concerns, please notify us within 2 hours of delivery for fresh milk and within 24 hours for other products like Ghee or Paneer.",
            list: [
                "Include a photo of the product/issue.",
                "Our team will verify the claim and initiate a replacement or refund immediately.",
                "Requests made after the specified timeframe may not be eligible for a refund due to the perishable nature of the goods."
            ]
        },
        {
            icon: CreditCard,
            title: "How Refunds are Issued",
            content: "Refunds for online payments will be made to the original payment source (Credit/Debit Card, UPI, etc.). For cash-on-delivery orders, refunds may be issued as store credit or via bank transfer.",
            list: null
        },
        {
            icon: ShieldCheck,
            title: "Dispute Resolution",
            content: "We strive for 100% customer satisfaction. If you are unhappy with the resolution provided, please contact our support team at mmvalidairyfarm@gmail.com with your order details.",
            list: null
        }
    ];

    return (
        <Layout>
            <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground section-padding">
                <div className="container-main">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Cancellation & Refund Policy</h1>
                        <p className="text-primary-foreground/90 text-lg max-w-2xl">
                            Our policy on cancellations and how we handle refunds for our products.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-padding bg-muted/30">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-border shadow-sm">
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            At MMVALI Farm, we take pride in the quality of our dairy products. Because our products are fresh and perishable, we have established the following policy regarding cancellations and refunds to ensure fairness and efficiency.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-lg bg-primary/10 p-3">
                                                <IconComponent className="w-6 h-6 text-primary" />
                                            </div>
                                            <CardTitle className="text-xl">{section.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                                            {section.content}
                                        </p>
                                        {section.list && (
                                            <ul className="space-y-2">
                                                {section.list.map((item, itemIndex) => (
                                                    <li key={itemIndex} className="flex items-start gap-3">
                                                        <span className="text-primary mt-1.5">•</span>
                                                        <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Refund;
