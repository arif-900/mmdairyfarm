import Layout from "@/components/layout/Layout";
import { ArrowLeft, RefreshCw, AlertCircle, Clock, ShieldCheck, CreditCard, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Refund = () => {
    const sections = [
        {
            icon: Undo2,
            title: "Cancellation Protocol",
            content: "Nature's freshness waits for no one. Orders for our fresh dairy products can be cancelled at any time before the delivery process begins.",
            list: [
                "Cancellations made 12 hours before scheduled delivery: 100% full refund.",
                "Cancellations after dispatch: As our products are fresh and farm-sourced, dispatched items cannot be cancelled or refunded to ensure hygiene standards."
            ]
        },
        {
            icon: Clock,
            title: "Refund Timeframes",
            content: "When elegance meets accuracy, processing takes time. Approved refunds are credited to your original payment method within 5-7 working days.",
            list: null
        },
        {
            icon: AlertCircle,
            title: "Excellence Standards",
            content: "In the rare event that our purity mandates are not met, we act swiftly. Quality concerns must be reported within 2 hours of delivery for fresh milk.",
            list: [
                "Please provide a photographic record of the concern for verification.",
                "Our excellence team will initiate an immediate replacement or refund upon validation.",
                "Late reports may not be eligible for refund due to the delicate, perishable nature of fresh dairy."
            ]
        },
        {
            icon: CreditCard,
            title: "Secure Reimbursements",
            content: "Reimbursements are issued with the same security as your initial payment. Online payments return to the source; Cash on Delivery orders are resolved via bank transfer or store credit.",
            list: null
        },
        {
            icon: ShieldCheck,
            title: "Excellence Resolution",
            content: "Your satisfaction is the measure of our farm's success. If a resolution does not meet your expectations, our senior support team is available at mmvalidairyfarm@gmail.com.",
            list: null
        }
    ];

    return (
        <Layout>
            {/* Header Section */}
            <section className="relative bg-forest-dark text-white overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 z-0 text-white">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(212,175,55,0.05),transparent)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,rgba(46,125,50,0.1),transparent)]" />
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
                            {"Refund & Cancellation".split(" ").map((word, wIdx) => (
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
                            Integrity in every transaction. Our policy on cancellations and our benchmark for excellence refunds.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-cream/20">
                <div className="container-main max-w-5xl">
                    <div className="mb-16 bg-white rounded-3xl p-8 md:p-12 border border-golden/10 shadow-soft animate-slide-up [animation-delay:1000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="flex items-center gap-4 mb-6">
                            <RefreshCw className="w-8 h-8 text-golden" />
                            <h2 className="font-display text-2xl font-bold text-forest-dark">The Guarantee of Purity</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            At MMVALI Farm, we believe in the absolute quality of our dairy. Because excellence is non-negotiable and our products are farm-fresh, we have established these guidelines to protect both our purity standards and your peace of mind.
                        </p>
                    </div>

                    <div className="grid gap-10">
                        {sections.map((section, index) => {
                            const IconComponent = section.icon;
                            return (
                                <div 
                                    key={index}
                                    className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
                                    style={{ animationDelay: `${1200 + index * 150}ms` }}
                                >
                                    <div className="flex flex-col md:flex-row gap-8 items-start group">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 rounded-2xl bg-white border border-golden/20 flex items-center justify-center shadow-soft group-hover:shadow-elevated transition-all duration-500 group-hover:rotate-6">
                                                <IconComponent className="w-8 h-8 text-golden" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <h3 className="font-display text-2xl font-bold text-forest-dark">{section.title}</h3>
                                            <p className="text-forest-light/80 leading-relaxed text-lg">
                                                {section.content}
                                            </p>
                                            {section.list && (
                                                <div className="grid gap-3 pt-2">
                                                    {section.list.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="flex items-start gap-4 p-4 bg-white/40 rounded-xl border border-golden/5 group-hover:border-golden/15 transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-golden mt-2 shrink-0" />
                                                            <span className="text-base text-forest-light/90">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {index < sections.length - 1 && (
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-golden/20 to-transparent my-10" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-24 p-12 bg-forest rounded-[3rem] text-center shadow-elevated animate-slide-up [animation-delay:2000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="max-w-xl mx-auto space-y-6">
                            <h2 className="font-display text-3xl font-bold text-white">Trust, Verified.</h2>
                            <p className="text-white/60 leading-relaxed italic">
                                "Our policies are built on the same integrity as our farming. Pure products, transparent promises."
                            </p>
                            <div className="h-px w-16 bg-golden/40 mx-auto" />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Refund;
