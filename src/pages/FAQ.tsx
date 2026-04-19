import Layout from "@/components/layout/Layout";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Truck, CreditCard, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FAQ = () => {
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
            <section className="relative bg-forest-dark text-white overflow-hidden py-24 md:py-32">
                {/* Decorative Elements */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-golden/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full -ml-20 -mb-20 blur-3xl" />
                </div>

                <div className="container-main relative z-10 pl-5">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-golden mb-12 transition-all hover:translate-x-[-4px]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-widest">Return to Home</span>
                    </Link>
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            {"Frequently Asked Questions".split(" ").map((word, wIdx, words) => (
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
                            Discover everything you need to know about the MMVALI farm-to-doorstep experience, our quality mandates, and how we serve you better.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ content */}
            <section className="section-padding bg-cream/30">
                <div className="container-main max-w-4xl">
                    <div className="space-y-16">
                        {faqCategories.map((category, catIdx) => (
                            <div key={catIdx} className="animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${(catIdx + 1) * 200 + 800}ms` }}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-white rounded-2xl shadow-soft border border-golden/20">
                                        {category.icon}
                                    </div>
                                    <h2 className="font-display text-2xl md:text-3xl font-bold text-forest-dark">
                                        {category.title}
                                    </h2>
                                </div>

                                <div className="grid gap-4">
                                    {category.items.map((item) => (
                                        <Card
                                            key={item.id}
                                            className={`overflow-hidden transition-all duration-300 border border-golden/10 hover:border-golden/30 ${openIndex === item.id ? 'shadow-elevated ring-1 ring-golden/20' : 'shadow-soft'}`}
                                        >
                                            <button
                                                onClick={() => toggleFaq(item.id)}
                                                className="w-full text-left p-6 flex items-center justify-between gap-4 focus:outline-none group"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${openIndex === item.id ? 'bg-golden scale-150 shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'bg-primary/20'}`} />
                                                    <span className={`font-semibold text-lg transition-colors duration-300 ${openIndex === item.id ? 'text-forest-dark' : 'text-forest-light'}`}>
                                                        {item.question}
                                                    </span>
                                                </div>
                                                <div className={`p-2 rounded-full transition-all duration-300 ${openIndex === item.id ? 'bg-golden text-white rotate-180' : 'bg-primary/5 text-primary'}`}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </button>
                                            {openIndex === item.id && (
                                                <CardContent className="pb-8 px-16 pt-0 animate-slide-up">
                                                    <div className="h-px w-12 bg-golden/30 mb-6" />
                                                    <p className="text-forest-light/90 leading-relaxed text-lg italic">
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
                    <div className="mt-24 bg-forest text-white rounded-[2rem] p-12 text-center relative overflow-hidden animate-slide-up shadow-elevated opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '1.6s' }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-golden/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <Star className="w-12 h-12 text-golden mx-auto mb-6 animate-pulse" />
                            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Still seeking excellence?</h2>
                            <p className="text-white/70 mb-10 max-w-xl mx-auto text-lg">
                                If your question wasn't answered above, our premium concierge team is ready to assist you in personalizing your MMVALI experience.
                            </p>
                            <Link to="/contact">
                                <Button size="xl" variant="accent" className="px-12 shadow-lg hover:scale-105 transition-transform">
                                    Contact Concierge
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default FAQ;
