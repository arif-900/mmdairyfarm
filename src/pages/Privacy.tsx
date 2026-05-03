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
            title: "Identity & Collection",
            content: "Your digital fingerprint is treated with absolute discretion. We collect name, contact, and delivery specifics solely to execute the premium farm-to-doorstep experience you expect.",
        },
        {
            icon: Lock,
            title: "Purpose of Usage",
            content: "Data usage is strictly contained to the following mandates:",
            list: [
                "Seamless processing and precision delivery of your orders.",
                "Real-time status updates via secure communication channels.",
                "Tailored support to ensure your MMVALI experience is flawless."
            ]
        },
        {
            icon: Shield,
            title: "Sanctity of Data",
            content: "We employ high-end encryption standards to safeguard your information. While no digital repository is impenetrable, our commitment to your privacy is absolute.",
        },
        {
            icon: Users,
            title: "Exclusive Stewardship",
            content: "MMVALI Farm never commoditizes your personal data. We do not sell or trade information; access is restricted to the essential logistics required for your service.",
        },
        {
            icon: Cookie,
            title: "Digital Footprints",
            content: "We utilize minimal, essential cookies to refine your journey on our platform. You retain full sovereignty over these through your browser's security settings.",
        },
        {
            icon: ExternalLink,
            title: "External Portals",
            content: "Links to curated third-party services (like our payment partners) are provided for convenience. Their privacy mandates are independent of MMVALI's standards.",
        },
        {
            icon: Clock,
            title: "Evolution of Privacy",
            content: "As our farm and technologies evolve, so will our privacy standards. Any refinements will be presented here, and your continued trust reflects an alignement with these updates.",
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
                            Your trust is our most valued heritage. Learn how we safeguard your personal data.
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
                            <h2 className="font-display text-2xl font-bold text-forest-dark">The Purity of Privacy</h2>
                        </div>
                        <p className="text-lg text-forest-light leading-relaxed">
                            At MMVALI Farm, the security of your information is as critical as the purity of our milk. We are committed to maintaining the highest standards of data integrity and transparency in every interaction.
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
                            This policy reflects our ongoing commitment to your digital security. Trusted by families, verified by excellence.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Privacy;
