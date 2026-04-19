import Layout from "@/components/layout/Layout";
import { ArrowLeft, Truck, Clock, MapPin, PackageCheck, AlertCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Shipping = () => {
    const sections = [
        {
            icon: Clock,
            title: "Elite Delivery Timelines",
            content: "Precision is our tradition. To ensure you receive our dairy at the peak of its freshness, we operate within specialized morning windows.",
            list: [
                "The Dawn Tradition: 5:00 AM - 8:00 AM (Daily deliveries).",
                "Next-Day Excellence: Orders finalized before 10:00 PM are meticulously dispatched for the following sunrise.",
                "Real-time Logistics: Our fleet is tracked to ensure the cold chain remains unbroken until reached your doorstep."
            ]
        },
        {
            icon: MapPin,
            title: "Curated Shipping Regions",
            content: "MMVALI Farm currently serves prioritized regions within the Kurnool district to maintain absolute product integrity.",
            list: [
                "Bhanakacherla & Surrounding Estates",
                "Bhanumukkala & Localized Regions",
                "Expanding Horizions: Check your specific coordinates during the secure checkout process."
            ]
        },
        {
            icon: Truck,
            title: "Transparent Logistics Fees",
            content: "Premium service involves specialized handling. Our shipping fees are calculated with transparency based on your distance from the Bhanakacherla farm.",
            list: [
                "Dynamic Routing: Fees are displayed instantly during checkout based on GPS coordinates.",
                "Order Value: Enjoy reduced or waived logistics fees for orders exceeding our excellence thresholds.",
                "Zero Overheads: What you see is exactly the cost of ensuring your milk arrives chilled and pure."
            ]
        },
        {
            icon: PackageCheck,
            title: "Hygienic Verification",
            content: "Our delivery partners are trained in the sanctity of dairy handling. We utilize specialized transit containers to maintain the farm's native temperature.",
            list: null
        },
        {
            icon: AlertCircle,
            title: "Unforeseen Environmental Factors",
            content: "While our 100% on-time record is a point of pride, extreme weather or infrastructure roadblocks may cause marginal delays. In such rare events, we communicate with priority via secure channels.",
            list: null
        }
    ];

    return (
        <Layout>
            {/* Header Section */}
            <section className="relative bg-forest-dark text-white overflow-hidden py-24 md:py-32 text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.05),transparent)]" />
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(46,125,50,0.1),transparent)]" />
                </div>

                <div className="container-main relative z-10 pl-5">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-golden mb-12 transition-all hover:translate-x-[-4px] uppercase text-xs font-bold tracking-[0.2em]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            {"Shipping & Delivery".split(" ").map((word, wIdx) => (
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
                            From the Bhanakacherla farm to your doorstep. Absolute freshness, guaranteed by elite logistics.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-cream/20">
                <div className="container-main max-w-5xl">
                    <div className="mb-16 bg-white rounded-3xl p-8 md:p-12 border border-golden/10 shadow-soft animate-slide-up [animation-delay:1000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="flex items-center gap-4 mb-6">
                            <Sparkles className="w-8 h-8 text-golden" />
                            <h2 className="font-display text-2xl font-bold text-forest-dark">The Cold Chain Promise</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            Dairy products are living essentials. Our logistics infrastructure is engineered to preserve the nutritional sanctity of our milk through a meticulous cold chain, ensuring the 'Fresh From Our Farm' promise is kept with every delivery.
                        </p>
                    </div>

                    <div className="grid gap-12">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <div 
                                    key={index}
                                    className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
                                    style={{ animationDelay: `${1200 + index * 150}ms` }}
                                >
                                    <div className="grid md:grid-cols-12 gap-8 items-start">
                                        <div className="md:col-span-1">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-golden/10 shadow-soft">
                                                <IconComponent className="w-6 h-6 text-golden" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-11 space-y-4">
                                            <h3 className="font-display text-2xl font-bold text-forest-dark">{section.title}</h3>
                                            <p className="text-forest-light/80 leading-relaxed text-lg">
                                                {section.content}
                                            </p>
                                            {section.list && (
                                                <div className="grid gap-2 pt-4">
                                                    {section.list.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="flex items-center gap-3">
                                                            <div className="w-1 h-1 rounded-full bg-golden" />
                                                            <span className="text-base text-forest-light/70 italic tracking-tight">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {index < sections.length - 1 && (
                                        <div className="h-px w-32 bg-golden/20 my-12" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-24 p-12 bg-forest rounded-[3rem] relative overflow-hidden shadow-elevated animate-slide-up [animation-delay:2000ms] opacity-0 [animation-fill-mode:forwards]">
                         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                         <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <Truck className="w-12 h-12 text-golden animate-float" />
                            <h2 className="font-display text-3xl font-bold text-white">Always Fresh, Always On Time.</h2>
                            <p className="text-white/60 max-w-lg mx-auto">
                                Every morning, our team travels the Kurnool roads to bring the farm to you. Pure goodness, delivered with passion.
                            </p>
                         </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Shipping;
