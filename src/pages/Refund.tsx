import Layout from "@/components/layout/Layout";
import { ArrowLeft, RefreshCw, AlertCircle, Clock, ShieldCheck, CreditCard, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Refund = () => {
    const navigate = useNavigate();
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
            content: "All reimbursements are issued with complete transparency directly to your original payment method via our secure Razorpay payment gateway.",
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
            <section className="relative bg-[#082D20] text-[#F5F3EC] border-b border-white/10 py-16 md:py-24">
                <div className="container-main relative z-10 pl-5">
                    <CircularBackButton 
                        onClick={() => navigate("/")} 
                        className="mb-8 border-white/10 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F]"
                    />
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none text-[#F5F3EC]">
                            REFUND & <span className="text-[#C98A24]">CANCELLATION</span>
                        </h1>
                        <p className="text-[#AAB8B0] text-base md:text-lg leading-relaxed">
                            Integrity in every transaction. Our policy on cancellations and our benchmark for excellence refunds.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-[#061A13] min-h-[60vh]">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-[#0B2118] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <RefreshCw className="w-8 h-8 text-[#C98A24]" />
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">The Guarantee of Purity</h2>
                        </div>
                        <p className="text-[#AAB8B0] leading-relaxed text-sm md:text-base">
                            At MM Dairy Farm, we believe in the absolute quality of our dairy. Because excellence is non-negotiable and our products are farm-fresh, we have established these guidelines to protect both our purity standards and your peace of mind.
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
                                                        <div key={itemIdx} className="flex items-start gap-3 p-3 bg-[#10291F] rounded-xl border border-white/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C98A24] mt-1.5 shrink-0" />
                                                            <span className="text-xs text-[#AAB8B0]">{item}</span>
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
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">Trust, Verified.</h2>
                            <p className="text-[#AAB8B0] text-xs leading-relaxed italic">
                                "Our policies are built on the same integrity as our farming. Pure products, transparent promises."
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Refund;
