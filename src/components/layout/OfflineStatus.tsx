import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
        >
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 shrink-0">
                <WifiOff className="w-7 h-7" />
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="font-black text-white text-lg uppercase tracking-tighter italic leading-none">Connection Lost</h3>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-tight">
                  You're currently browsing offline. Some features may be limited.
                </p>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
