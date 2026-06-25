import Layout from "@/components/layout/Layout";
import { WalletTab } from "@/components/profile/WalletTab";
import { Wallet as WalletIcon } from "lucide-react";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <div className="min-h-screen">
                {/* Header Section */}
                <section className="bg-slate-900 text-white section-padding relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent pointer-events-none" />
                    
                    <div className="container-main relative z-10">
                        <CircularBackButton 
                            onClick={() => navigate("/")} 
                            className="mb-8"
                        />
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <WalletIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Financial Hub</span>
                                </div>
                                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">
                                    My <span className="text-emerald-400">Wallet</span>
                                </h1>
                            </div>
                            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                                Manage your farm credits and track refund history in real-time.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dashboard Section */}
                <section className="section-padding">
                    <div className="container-main max-w-4xl">
                        <WalletTab />
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default Wallet;
