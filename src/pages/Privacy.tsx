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
            <section className="relative bg-forest-dark text-white overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.05),transparent)]" />
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_80%,rgba(46,125,50,0.1),transparent)]" />
                </div>

                <div className="container-main relative z-10 pl-5">
                    <CircularBackButton 
                        onClick={() => navigate("/")} 
                        className="mb-12"
                    />
                    <div className="max-w-3xl">
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            {"Privacy Policy".split(" ").map((word, wIdx) => (
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
                            Official policy regarding the collection, processing, and security of user data.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding bg-cream/20">
                <div className="container-main max-w-5xl">
                    <div className="mb-16 bg-white rounded-3xl p-8 md:p-12 border border-golden/10 shadow-soft animate-slide-up [animation-delay:1000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="flex items-center gap-4 mb-6">
                            <Shield className="w-8 h-8 text-golden" />
                            <h2 className="font-display text-2xl font-bold text-forest-dark">Data Protection & Privacy Standards</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            MM Dairy Farm is committed to the protection of customer privacy and operational data security. This document details how we process user data in compliance with applicable information technology laws and e-commerce guidelines in India.
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
                                            <p className="text-forest-light/80 leading-relaxed text-sm mb-4">
                                                {section.content}
                                            </p>
                                            {section.list && (
                                                <ul className="space-y-2">
                                                    {section.list.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="flex items-start gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-golden mt-2 shrink-0" />
                                                            <span className="text-xs text-forest-light/70">{item}</span>
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

                    <div className="mt-20 text-center animate-slide-up [animation-delay:2000ms] opacity-0 [animation-fill-mode:forwards]">
                        <div className="h-px w-24 bg-golden/30 mx-auto mb-8" />
                        <p className="text-forest-light/60 text-sm max-w-lg mx-auto italic">
                            This document is legally binding. Continued use of MM Dairy Farm services constitutes acceptance of these data privacy practices. For data removal requests, please contact our support team.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Privacy;
