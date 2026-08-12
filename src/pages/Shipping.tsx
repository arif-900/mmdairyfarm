import Layout from "@/components/layout/Layout";
import { ArrowLeft, Truck, Clock, MapPin, PackageCheck, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Shipping = () => {
    const navigate = useNavigate();
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
            <section className="relative bg-[#082D20] text-[#F5F3EC] border-b border-white/10 py-16 md:py-24">
                <div className="container-main relative z-10 pl-5">
                    <CircularBackButton 
                        onClick={() => navigate("/")} 
                        className="mb-8 border-white/10 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F]"
                    />
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none text-[#F5F3EC]">
                            SHIPPING & <span className="text-[#C98A24]">DELIVERY</span>
                        </h1>
                        <p className="text-[#AAB8B0] text-base md:text-lg leading-relaxed">
                            From the Bhanakacherla farm to your doorstep. Absolute freshness, guaranteed by elite logistics.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-[#061A13] min-h-[60vh]">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-[#0B2118] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Sparkles className="w-8 h-8 text-[#C98A24]" />
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">The Cold Chain Promise</h2>
                        </div>
                        <p className="text-[#AAB8B0] leading-relaxed text-sm md:text-base">
                            Dairy products are living essentials. Our logistics infrastructure is engineered to preserve the nutritional sanctity of our milk through a meticulous cold chain, ensuring the 'Fresh From Our Farm' promise is kept with every delivery.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <div key={index} className="bg-[#0B2118] rounded-2xl p-6 border border-white/10 shadow-xl">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex-shrink-0">
                                            <div className="w-14 h-14 rounded-xl bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24]">
                                                <IconComponent className="w-7 h-7" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <h3 className="font-display text-xl font-bold text-[#F5F3EC]">{section.title}</h3>
                                            <p className="text-[#AAB8B0] leading-relaxed text-sm">
                                                {section.content}
                                            </p>
                                            {section.list && (
                                                <div className="grid gap-2 pt-2">
                                                    {section.list.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="flex items-center gap-3 p-3 bg-[#10291F] rounded-xl border border-white/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C98A24] shrink-0" />
                                                            <span className="text-xs text-[#AAB8B0] italic">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 p-8 bg-[#0B2118] rounded-3xl border border-[#C98A24]/30 text-center">
                        <div className="max-w-xl mx-auto space-y-3">
                            <Truck className="w-10 h-10 text-[#C98A24] mx-auto animate-float" />
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">Always Fresh, Always On Time.</h2>
                            <p className="text-[#AAB8B0] text-xs leading-relaxed">
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
