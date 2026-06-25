import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Info,
    Sparkles,
    Loader2,
    Calendar,
    ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const WalletTab = () => {
    const { user, profile } = useAuth();
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchLedger();
        }
    }, [user]);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("wallet_ledger")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLedger(data || []);
        } catch (err) {
            console.error("Ledger fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading your vault...</p>
            </div>
        );
    }

    const currentBalance = profile?.reward_coins || 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Balance Card */}
            <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />

                <Card className="relative overflow-hidden rounded-[40px] border-none bg-slate-950 text-white shadow-2xl p-8 md:p-12 overflow-hidden ring-1 ring-white/10">
                    {/* Animated shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <Wallet className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Wallet Balance</h3>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-6xl md:text-7xl font-black tracking-tighter italic">₹{currentBalance}</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Available Coins</Badge>
                            </div>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest max-w-[280px] leading-relaxed">
                                Use these coins to pay for your daily milk subscriptions or one-time orders.
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm self-stretch md:self-auto flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-0.5 shadow-xl mb-3 relative overflow-hidden group/coin cursor-pointer">
                                <img src="/favicon.png" className="w-full h-full object-cover rounded-[14px] animate-spin-slow" alt="Coin" />
                                <div className="absolute inset-0 bg-white/20 animate-shine" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">MM Rewards Program</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Transaction History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <History className="w-4 h-4" />
                        </div>
                        <h4 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Movement History</h4>
                    </div>
                    <Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase tracking-widest py-1 border-slate-200">
                        {ledger.length} Transactions
                    </Badge>
                </div>

                {ledger.length === 0 ? (
                    <div className="py-20 flex flex-col items-center text-center space-y-6 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-sm">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h5 className="text-lg font-black text-slate-900 uppercase">Your vault is empty</h5>
                            <p className="text-xs font-bold text-slate-400 max-w-[240px]">
                                Once you earn coins or receive a refund, they'll magically appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {ledger.map((entry) => (
                            <div key={entry.id} className="group bg-white rounded-[28px] p-6 border border-slate-100 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                        entry.type === 'credit' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                    )}>
                                        {entry.type === 'credit' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-900 leading-tight uppercase tracking-tight text-sm md:text-base">{entry.reason}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(entry.created_at), "MMM dd, yyyy")}
                                            </div>
                                            {entry.metadata?.order_id && (
                                                <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 rounded-md">
                                                    Order: #{entry.metadata.order_id.slice(0, 8)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-2xl md:text-3xl font-black tracking-tighter italic",
                                        entry.type === 'credit' ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {entry.type === 'credit' ? '+' : '-'}₹{entry.amount}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        {entry.type === 'credit' ? 'Credited' : 'Debited'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAQ/Info */}
            <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100/50">
                <div className="flex gap-5">
                    <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-400/20">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                        <h5 className="font-black text-amber-900 uppercase tracking-tight">How to use your coins?</h5>
                        <p className="text-xs font-semibold text-amber-800/70 leading-relaxed italic">
                            Every time you checkout, you'll see a sparkle in the payment summary! Toggle the "Use Wallet Balance" button to get an instant discount. 1 Coin = ₹1.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
