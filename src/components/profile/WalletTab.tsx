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
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl md:rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />

                <Card className="relative overflow-hidden rounded-2xl md:rounded-[40px] border-none bg-slate-950 text-white shadow-2xl p-5 md:p-12 overflow-hidden ring-1 ring-white/10">
                    {/* Animated shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl border border-white/10">
                                    <Wallet className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Wallet Balance</h3>
                            </div>
                            <div className="flex items-baseline gap-2 md:gap-3">
                                <span className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter italic">₹{currentBalance}</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-2 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest">Available Coins</Badge>
                            </div>
                            <p className="text-white/40 text-[9px] md:text-[10px] font-bold uppercase tracking-widest max-w-[280px] leading-relaxed">
                                Use these coins to pay for your daily milk subscriptions or one-time orders.
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5 self-stretch md:self-auto flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl md:rounded-2xl p-0.5 shadow-xl mb-2 md:mb-3 relative overflow-hidden group/coin cursor-pointer">
                                <img src="/favicon.png" className="w-full h-full object-cover rounded-[10px] md:rounded-[14px] animate-spin-slow" alt="Coin" />
                                <div className="absolute inset-0 bg-white/20 animate-shine" />
                            </div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">MM Rewards</p>
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
                    <div className="py-12 flex flex-col items-center text-center space-y-4 bg-slate-50/50 rounded-2xl md:rounded-[40px] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="text-base font-black text-slate-900 uppercase">Your vault is empty</h5>
                            <p className="text-xs font-bold text-slate-400 max-w-[200px]">
                                Once you earn coins or receive a refund, they'll magically appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                        {ledger.map((entry) => (
                            <div key={entry.id} className="group bg-white rounded-xl md:rounded-[28px] p-2.5 md:p-6 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-900/5 flex items-center justify-between gap-3 md:gap-6">
                                <div className="flex items-center gap-2.5 md:gap-5 min-w-0 flex-1">
                                    <div className={cn(
                                        "w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                                        entry.type === 'credit' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                    )}>
                                        {entry.type === 'credit' ? <ArrowUpRight className="w-4 h-4 md:w-6 md:h-6" /> : <ArrowDownLeft className="w-4 h-4 md:w-6 md:h-6" />}
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
                                        <p className="font-black text-slate-900 leading-tight uppercase tracking-tight text-[10px] md:text-base truncate">{entry.reason}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                                                <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                {format(new Date(entry.created_at), "MMM dd")}
                                            </div>
                                            {entry.metadata?.order_id && (
                                                <Badge variant="secondary" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 rounded-md px-1 py-0.5 md:px-2 shrink-0">
                                                    #{entry.metadata.order_id.slice(0, 6)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn(
                                        "text-base md:text-3xl font-black tracking-tighter italic leading-none",
                                        entry.type === 'credit' ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {entry.type === 'credit' ? '+' : '-'}₹{entry.amount}
                                    </p>
                                    <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                        {entry.type === 'credit' ? 'Credited' : 'Debited'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAQ/Info */}
            <div className="bg-amber-50 rounded-2xl md:rounded-[32px] p-4 md:p-8 border border-amber-100/50">
                <div className="flex gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-400/20">
                        <Info className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-black text-amber-900 uppercase tracking-tight text-xs sm:text-sm">How to use your coins?</h5>
                        <p className="text-[11px] sm:text-xs font-semibold text-amber-800/70 leading-relaxed italic">
                            Every time you checkout, you'll see a option in the payment summary! Toggle the "Use Wallet Balance" button to get an instant discount. 1 Coin = ₹1.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
