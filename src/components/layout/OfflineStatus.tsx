import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const overlayCls = 'fixed inset-0 z-[99999] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-6 transition-opacity duration-300';

export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={overlayCls + (isOffline ? ' opacity-100' : ' opacity-0 pointer-events-none')}>
      {isOffline && (
          <div className="text-center space-y-10 max-w-md w-full animate-in fade-in zoom-in duration-500">
            {/* Animated Icon Container */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-rose-500/20 rounded-[40px] animate-ping" />
              <div className="relative w-full h-full bg-rose-500 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-rose-500/40">
                <WifiOff className="w-16 h-16" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                Connection <br /><span className="text-rose-500">Lost</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto">
                We've lost the signal to the farm. Please check your network and try again.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => window.location.reload()}
                className="h-16 px-10 rounded-[28px] bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </Button>
            </div>

            {/* Subtle brand mark */}
            <div className="pt-12 flex items-center justify-center gap-3 opacity-20">
              <img src="/favicon.png" className="w-6 h-6 grayscale" alt="Logo" />
              <span className="font-black text-sm uppercase tracking-widest text-slate-900">MM Dairy</span>
            </div>
          </div>
      )}
    </div>
  );
}
