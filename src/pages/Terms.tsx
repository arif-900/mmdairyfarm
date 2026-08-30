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
            content: "Subscriptions for products (e.g. Milk, Curd, Ghee) are governed by a strictly prepaid model. Balance refunds resulting from subscription pauses, adjustments, or cancellations are credited automatically to your digital wallet as Reward Coins. Reward Coins carry a valuation of 4 Coins = ₹1 (1 Coin = ₹0.25), are non-transferable, cannot be redeemed for cash, and can only be used as checkout discounts on this platform."
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
            <section className="relative bg-[#082D20] text-[#F5F3EC] border-b border-white/10 py-16 md:py-24">
                <div className="container-main relative z-10 pl-5">
                    <CircularBackButton 
                        onClick={() => navigate("/")} 
                        className="mb-8 border-white/10 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F]"
                    />
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none text-[#F5F3EC]">
                            TERMS & <span className="text-[#C98A24]">CONDITIONS</span>
                        </h1>
                        <p className="text-[#AAB8B0] text-base md:text-lg leading-relaxed">
                            Legal guidelines and conditions governing the purchase, subscription, and delivery of dairy products.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-[#061A13] min-h-[60vh]">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-[#0B2118] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <FileText className="w-8 h-8 text-[#C98A24]" />
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">Terms of Service Agreement</h2>
                        </div>
                        <p className="text-[#AAB8B0] leading-relaxed text-sm md:text-base">
                            By registering an account, purchasing dairy products, or configuring a prepaid subscription on MM Dairy Farm, you agree to comply with and be bound by the following terms of service.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <div key={index}>
                                    <Card className="h-full bg-[#0B2118] border border-white/10 hover:border-[#C98A24]/40 hover:shadow-xl rounded-2xl group transition-all">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-xl bg-[#10291F] p-3 text-[#C98A24] border border-white/10 group-hover:bg-[#C98A24] group-hover:text-[#061A13] transition-colors">
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                <CardTitle className="text-xl font-display font-bold text-[#F5F3EC]">{section.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-[#AAB8B0] leading-relaxed text-sm">
                                                {section.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <div className="h-px w-24 bg-[#C98A24]/30 mx-auto mb-6" />
                        <p className="text-[#718078] text-xs max-w-lg mx-auto italic">
                            These terms constitute a legally binding agreement between you and MM Dairy Farm. Continued usage of our e-commerce portal and subscription deliveries confirms your ongoing alignment with these clauses.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Terms;
