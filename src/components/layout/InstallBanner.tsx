import { Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const InstallBanner = () => {
    const { isInstallable, handleInstall } = usePWAInstall();
    const [dismissed, setDismissed] = useState(false);

    if (!isInstallable || dismissed) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#1C2533] rounded-[32px] p-4 pr-12 shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Download className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-black italic text-sm">Install MM Dairy App</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Faster access & offline orders</p>
                    </div>
                    <Button 
                        onClick={handleInstall}
                        size="sm"
                        className="ml-auto rounded-xl bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest px-6 h-10 relative z-10"
                    >
                        Install
                    </Button>
                </div>
                
                <button 
                    onClick={() => setDismissed(true)}
                    className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>
                
                {/* Decorative background element - added pointer-events-none */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            </div>
        </div>
    );
};

export default InstallBanner;
