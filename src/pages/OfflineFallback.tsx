import { WifiOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const OfflineFallback = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-[40px] bg-emerald-100 flex items-center justify-center mb-8 shadow-xl shadow-emerald-200/50">
                <WifiOff className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="font-display text-3xl font-black text-slate-800 italic tracking-tighter mb-4">You're Offline</h1>
            <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
                It seems you've lost your connection. Farm fresh milk is just a signal away!
            </p>
            
            <Button 
                onClick={() => window.location.reload()} 
                className="rounded-[24px] h-14 px-8 font-black uppercase text-xs tracking-widest gap-3 shadow-lg shadow-primary/30"
            >
                <RotateCw className="w-4 h-4" />
                Retry Connection
            </Button>
            
            <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">MM Dairy Farm • PWA Protocol</p>
        </div>
    );
};

export default OfflineFallback;
