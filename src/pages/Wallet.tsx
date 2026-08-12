import Layout from "@/components/layout/Layout";
import { WalletTab } from "@/components/profile/WalletTab";
import { Wallet as WalletIcon } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <div className="min-h-screen bg-[#061A13]">
                {/* Header Section */}
                <section className="bg-[#082D20] text-[#F5F3EC] section-padding relative overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F8A5F]/20 to-transparent pointer-events-none" />

                    <div className="container-main relative z-10">
                        <CircularBackButton
                            onClick={() => navigate("/")}
                            className="mb-8 border-white/10 bg-[#0B2118] text-[#F5F3EC] hover:bg-[#10291F]"
                        />

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-[#C98A24] rounded-xl flex items-center justify-center shadow-lg text-[#061A13]">
                                        <WalletIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C98A24]">Financial Hub</span>
                                </div>
                                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none text-[#F5F3EC]">
                                    My <span className="text-[#C98A24]">Wallet</span>
                                </h1>
                            </div>
                            <p className="text-[#AAB8B0] text-[11px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                                Manage your farm credits and track refund history in real-time.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dashboard Section */}
                <section className="section-padding bg-[#061A13]">
                    <div className="container-main max-w-4xl">
                        <WalletTab />
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default Wallet;
