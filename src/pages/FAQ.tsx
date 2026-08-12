import Layout from "@/components/layout/Layout";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Truck, CreditCard, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const faqCategories = [
        {
            title: "Our Quality & Farm",
            icon: <ShieldCheck className="w-6 h-6 text-golden" />,
            items: [
                {
                    id: "q1",
                    question: "What makes MMVALI dairy products 'Premium'?",
                    answer: "Our commitment to excellence starts at our Bhanakacherla farm, where our cattle are ethically raised on organic fodder. We maintain a strict 'Farm-to-Doorstep' cold chain, ensuring zero additives and maximum nutritional integrity from the moment of milking."
                },
                {
                    id: "q2",
                    question: "Is the milk pasteurized or farm-fresh raw?",
                    answer: "We offer both options to suit your family's needs. Whether you prefer the raw, natural richness of farm-fresh milk or our carefully chilled pasteurized options, we guarantee the highest standards of hygiene and purity."
                }
            ]
        },
        {
            title: "Delivery & Orders",
            icon: <Truck className="w-6 h-6 text-golden" />,
            items: [
                {
                    id: "d1",
                    question: "When can I expect my daily MMVALI delivery?",
                    answer: "To ensure your morning begins with the purest nutrition, our dedicated team delivers daily between 5:00 AM and 8:00 AM. Each bottle is chilled and handled with extreme care during transit."
                },
                {
                    id: "d2",
                    question: "How do I manage my premium orders?",
                    answer: "Elegance meets convenience in our portal. Simply log in and navigate to 'My Orders' to view your history or track current deliveries. For modifications, please contact our support team at least 12 hours before the scheduled delivery."
                }
            ]
        },
        {
            title: "Billing & Excellence Guarantee",
            icon: <CreditCard className="w-6 h-6 text-golden" />,
            items: [
                {
                    id: "b1",
                    question: "What secure payment methods are supported?",
                    answer: "We partner with Razorpay to provide seamless, secure transactions. We accept all major Credit/Debit cards, UPI (Google Pay, PhonePe), and Net Banking for effortless payment management."
                },
                {
                    id: "b2",
                    question: "What is the MMVALI Excellence Guarantee?",
                    answer: "Your satisfaction is our mandate. If our products ever fall short of the excellence you expect, please contact our support within 2 hours of delivery. We provide transparent refund and cancellation policies to ensure your peace of mind."
                }
            ]
        }
    ];

    const toggleFaq = (id: string) => {
        setOpenIndex(openIndex === id ? null : id);
    };

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
                            FREQUENTLY ASKED <span className="text-[#C98A24]">QUESTIONS</span>
                        </h1>
                        <p className="text-[#AAB8B0] text-base md:text-lg leading-relaxed">
                            Discover everything you need to know about the MM Dairy farm-to-doorstep experience, our quality mandates, and how we serve you better.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ content */}
            <section className="section-padding bg-[#061A13] min-h-[60vh]">
                <div className="container-main max-w-4xl">
                    <div className="space-y-12">
                        {faqCategories.map((category, catIdx) => (
                            <div key={catIdx}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-[#0B2118] rounded-2xl border border-white/10 text-[#C98A24]">
                                        {category.icon}
                                    </div>
                                    <h2 className="font-display text-2xl md:text-3xl font-bold text-[#F5F3EC]">
                                        {category.title}
                                    </h2>
                                </div>

                                <div className="grid gap-4">
                                    {category.items.map((item) => (
                                        <Card
                                            key={item.id}
                                            className={`overflow-hidden transition-all duration-300 border border-white/10 bg-[#0B2118] text-[#F5F3EC] ${openIndex === item.id ? 'shadow-xl ring-1 ring-[#C98A24]/40 border-[#C98A24]/40' : 'shadow-md'}`}
                                        >
                                            <button
                                                onClick={() => toggleFaq(item.id)}
                                                className="w-full text-left p-6 flex items-center justify-between gap-4 focus:outline-none group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${openIndex === item.id ? 'bg-[#C98A24] scale-150 shadow-[0_0_8px_rgba(201,138,36,0.8)]' : 'bg-white/20'}`} />
                                                    <span className={`font-semibold text-base sm:text-lg transition-colors duration-300 ${openIndex === item.id ? 'text-[#C98A24]' : 'text-[#F5F3EC]'}`}>
                                                        {item.question}
                                                    </span>
                                                </div>
                                                <div className={`p-2 rounded-full transition-all duration-300 ${openIndex === item.id ? 'bg-[#C98A24] text-[#061A13] rotate-180' : 'bg-[#10291F] text-[#F5F3EC]'}`}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </button>
                                            {openIndex === item.id && (
                                                <CardContent className="pb-6 px-12 pt-0">
                                                    <div className="h-px w-12 bg-[#C98A24]/30 mb-4" />
                                                    <p className="text-[#AAB8B0] leading-relaxed text-sm md:text-base italic">
                                                        "{item.answer}"
                                                    </p>
                                                </CardContent>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Support Banner */}
                    <div className="mt-16 bg-[#0B2118] text-[#F5F3EC] rounded-3xl p-8 sm:p-12 text-center border border-[#C98A24]/30 shadow-2xl">
                        <Star className="w-10 h-10 text-[#C98A24] mx-auto mb-4 animate-pulse" />
                        <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-[#F5F3EC]">Still seeking excellence?</h2>
                        <p className="text-[#AAB8B0] mb-8 max-w-xl mx-auto text-sm sm:text-base">
                            If your question wasn't answered above, our concierge team is ready to assist you in personalizing your MM Dairy experience.
                        </p>
                        <Link to="/contact">
                            <Button size="xl" className="px-10 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-bold rounded-xl shadow-lg">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default FAQ;
