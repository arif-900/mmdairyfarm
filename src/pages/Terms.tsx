import Layout from "@/components/layout/Layout";
import { ArrowLeft, Package, CreditCard, Truck, User, Globe, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Terms = () => {
    const navigate = useNavigate();
    const sections = [
        {
            icon: Package,
            title: "Account Registration & Security",
            content: "Accessing certain features (such as making purchases, subscribing to products, and reviewing wallet balances) requires user registration. Accounts are authenticated securely via Supabase (email/password or Google OAuth). Users are solely responsible for maintaining the confidentiality of their authentication credentials and are fully liable for all transactions or orders placed under their account."
        },
        {
            icon: CreditCard,
            title: "Prepaid Subscriptions & Wallet Coins",
            content: "Subscriptions for products (e.g. Milk, Curd, Ghee) are governed by a strictly prepaid model. Balance refunds resulting from subscription pauses, adjustments, or cancellations are credited automatically to your digital wallet as Reward Coins. Reward Coins carry a valuation of 1 Coin = ₹1, are non-transferable, cannot be redeemed for cash, and can only be used as checking discounts on this platform."
        },
        {
            icon: Truck,
            title: "Delivery Terms & Responsibilities",
            content: "Deliveries are executed by our rider network within specified slots: Morning (5:00 AM - 8:00 AM) and Evening (5:00 PM - 8:00 PM). Customers must pinpoint accurate drop coordinates using our integrated Mapbox picker. We are not liable for delayed, failed, or spoiled deliveries resulting from inaccurate map pins, locked gates, or unavailable contact numbers."
        },
        {
            icon: User,
            title: "Product Availability & Pricing",
            content: "All raw dairy products are perishable goods and are subject to real-time farm availability. We reserve the right to limit order quantities or pause subscription drops in cases of supply fluctuations. Product pricing is calculated at the rates active during checkout. All digital receipts and orders are logged on our servers."
        },
        {
            icon: Globe,
            title: "Intellectual Property Ownership",
            content: "All digital assets, source code, visual interfaces, database designs, branding elements, and media files on this platform are the intellectual property of MM Dairy Farm. Unauthorized copying, reverse-engineering, or usage of these materials without explicit written consent is strictly prohibited under Indian trademark and copyright acts."
        },
        {
            icon: AlertCircle,
            title: "Limitation of Liability",
            content: "MM Dairy Farm, its directors, and riders shall not be liable for any indirect, incidental, or consequential damages resulting from database server interruptions, third-party payment portal (Razorpay) failures, or the ingestion of dairy goods that were stored improperly by the client post-delivery."
        },
        {
            icon: RefreshCw,
            title: "Governing Law & Disputes",
            content: "These terms and conditions are governed by and construed in accordance with the laws of the Republic of India. Any legal disputes or claims arising out of the use of this website, wallet system, or subscription deliveries shall be subject to the exclusive jurisdiction of the competent courts in India."
        }
    ];

    return (
        <Layout>
            {/* Header Section */}
            <section className="relative bg-forest-dark text-white overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(212,175,55,0.05),transparent)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(46,125,50,0.1),transparent)]" />
                </div>

                <div className="container-main relative z-10 pl-5">
                    <CircularBackButton 
                        onClick={() => navigate("/")} 
                        className="mb-12"
                    />
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            {"Terms & Conditions".split(" ").map((word, wIdx) => (
                                <span key={wIdx} className="inline-block mr-4">
                                    {word.split("").map((char, cIdx) => (
                                        <span 
                                            key={cIdx} 
                                            className="inline-block animate-character-reveal opacity-0"
                                            style={{ animationDelay: `${(wIdx * 5 + cIdx) * 0.05}s` }}
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </span>
                            ))}
                        </h1>
                        <p className="text-white/70 text-lg md:text-xl leading-relaxed animate-slide-up [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
                            Legal guidelines and conditions governing the purchase, subscription, and delivery of dairy products.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-cream/20">
                <div className="container-main max-w-5xl">
                    <div className="mb-16 bg-white rounded-3xl p-8 md:p-12 border border-golden/10 shadow-soft animate-slide-up [animation-delay:1000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="flex items-center gap-4 mb-6">
                            <FileText className="w-8 h-8 text-golden" />
                            <h2 className="font-display text-2xl font-bold text-forest-dark">Terms of Service Agreement</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            By registering an account, purchasing dairy products, or configuring a prepaid subscription on MM Dairy Farm, you agree to comply with and be bound by the following terms of service.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <div 
                                    key={index}
                                    className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
                                    style={{ animationDelay: `${1200 + index * 100}ms` }}
                                >
                                    <Card className="h-full bg-white/50 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-500 border border-golden/5 hover:border-golden/20 hover:shadow-elevated rounded-2xl group">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-xl bg-primary/5 p-3 group-hover:bg-golden/10 transition-colors">
                                                    <IconComponent className="w-6 h-6 text-primary group-hover:text-golden transition-colors" />
                                                </div>
                                                <CardTitle className="text-xl font-display font-bold text-forest-dark">{section.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-forest-light/80 leading-relaxed text-sm">
                                                {section.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-20 text-center animate-slide-up [animation-delay:2000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="h-px w-24 bg-golden/30 mx-auto mb-8" />
                        <p className="text-forest-light/60 text-sm max-w-lg mx-auto italic">
                            These terms constitute a legally binding agreement between you and MM Dairy Farm. Continued usage of our e-commerce portal and subscription deliveries confirms your ongoing alignment with these clauses.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Terms;
