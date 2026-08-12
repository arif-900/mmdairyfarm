import Layout from "@/components/layout/Layout";
import { ArrowLeft, Lock, FileText, Shield, Users, Cookie, ExternalLink, Clock, Fingerprint } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
    const navigate = useNavigate();
    const sections = [
        {
            icon: Fingerprint,
            title: "Information We Collect",
            content: "We collect and store personal identifiers necessary to create accounts and fulfill orders, including your full name, email address, mobile phone number, delivery address line, and precise geolocation coordinates picked via our interactive map picker.",
        },
        {
            icon: Lock,
            title: "How Information Is Used",
            content: "Your data is processed strictly for the following operational requirements:",
            list: [
                "User authentication and profile management via secure tokens.",
                "Processing and delivering dairy orders to your specified coordinates.",
                "Managing subscription calendars (Daily, Alternate, Weekly, Monthly plans).",
                "Maintaining digital wallet balance ledgers (Reward Coins credit/debit records).",
                "Sending transactional updates and order receipts via WhatsApp alerts."
            ]
        },
        {
            icon: Shield,
            title: "Payments & Financial Security",
            content: "All online transactions are securely routed through our integrated payment partner, Razorpay. Credit/debit card, net banking, or UPI details are processed on secure gateways and are never stored on our database. In-app digital wallet transactions are maintained locally via Reward Coins where 1 Coin equals ₹1.",
        },
        {
            icon: Users,
            title: "Third-Party Data Transfer",
            content: "We share user data only with essential service providers necessary to operate the application: Supabase (cloud database hosting and authentication), Razorpay (payment processing), Mapbox (geolocation address mapping), and WhatsApp Business API (transactional alerts).",
        },
        {
            icon: Cookie,
            title: "Cookies & Local Storage",
            content: "The platform uses essential browser local storage key-value pairs (including Supabase auth tokens and shopping basket states) to ensure user sessions remain active, avoid data loss during checkouts, and maintain operational stability.",
        },
        {
            icon: ExternalLink,
            title: "AI Assistant Usage",
            content: "When interacting with the integrated AI Chat Assistant widget, your queries and basic order history are processed dynamically to resolve customer issues. Inputs provided in the chat are temporarily stored in local session memory to maintain thread continuity.",
        },
        {
            icon: Clock,
            title: "Data Security & Retention",
            content: "User data is stored securely in databases managed by Supabase, protected by Row-Level Security (RLS) and SSL encryption during transit. We retain personal records as long as your account remains active. You can contact support at any time to request permanent deletion of your profile data.",
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
                            PRIVACY <span className="text-[#C98A24]">POLICY</span>
                        </h1>
                        <p className="text-[#AAB8B0] text-base md:text-lg leading-relaxed">
                            Official policy regarding the collection, processing, and security of user data.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-[#061A13] min-h-[60vh]">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-[#0B2118] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Shield className="w-8 h-8 text-[#C98A24]" />
                            <h2 className="font-display text-2xl font-bold text-[#F5F3EC]">Data Protection & Privacy Standards</h2>
                        </div>
                        <p className="text-[#AAB8B0] leading-relaxed text-sm md:text-base">
                            MM Dairy Farm is committed to the protection of customer privacy and operational data security. This document details how we process user data in compliance with applicable information technology laws and e-commerce guidelines in India.
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
                                            <p className="text-[#AAB8B0] leading-relaxed text-sm mb-4">
                                                {section.content}
                                            </p>
                                            {section.list && (
                                                <ul className="space-y-2">
                                                    {section.list.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C98A24] mt-1.5 shrink-0" />
                                                            <span className="text-xs text-[#AAB8B0]">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <div className="h-px w-24 bg-[#C98A24]/30 mx-auto mb-6" />
                        <p className="text-[#718078] text-xs max-w-lg mx-auto italic">
                            This document is legally binding. Continued use of MM Dairy Farm services constitutes acceptance of these data privacy practices. For data removal requests, please contact our support team.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Privacy;
