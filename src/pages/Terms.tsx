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
            title: "Product Integrity",
            content: "Nature's purity is our promise. All MMVALI dairy products are subject to seasonal availability. We reserve the right to prioritize quality over quantity, meaning production limits may be applied to ensure every bottle meets our elite standards."
        },
        {
            icon: CreditCard,
            title: "Premium Transactions",
            content: "Excellence is reflected in our transparent pricing. All orders are charged at the rate active during checkout. We utilize secure payment gateways to ensure your financial data remains as protected as our heritage."
        },
        {
            icon: Truck,
            title: "Bespoke Delivery",
            content: "Our logistics team ensures a seamless farm-to-doorstep experience. While we strive for absolute precision in our 5 AM - 8 AM window, timelines may marginally shift due to external environmental factors."
        },
        {
            icon: User,
            title: "Client Commitment",
            content: "The MMVALI experience is a partnership. To ensure the freshest possible delivery, we rely on your accurate contact and location details. Success in our service is shared when information is precise."
        },
        {
            icon: Globe,
            title: "Digital Sovereignty",
            content: "The digital essence of MMVALI—our brand, imagery, and intellectual property—is protected. Use of our assets without explicit consent is a breach of our brand values and legal mandates."
        },
        {
            icon: AlertCircle,
            title: "Balanced Liability",
            content: "While we stand by the purity of our farm products, MMVALI is not liable for indirect or incidental consequences arising from the digital use of our platform or external handling post-delivery."
        },
        {
            icon: RefreshCw,
            title: "Evolution of Terms",
            content: "As we grow our farm and services, these terms may evolve. Your continued journey with MMVALI implies an ongoing agreement with our latest standards and policies."
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
                            The foundations of our mutual commitment to excellence, purity, and heritage.
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
                            <h2 className="font-display text-2xl font-bold text-forest-dark">Mandate of Service</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            Welcome to the MMVALI Farm circle. By navigating our platform and engaging with our services, you align with the standards and mandates outlined below. These terms safeguard our farm's heritage and ensure the consistent delivery of excellence to your home.
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
                            These terms were last updated to meet our current excellence standards. Continued use of MMVALI services constitutes acceptance of these refined mandates.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Terms;