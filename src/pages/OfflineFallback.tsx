import { useState } from "react";
import { WifiOff, RotateCw, Leaf, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineFallbackProps {
  onRetrySuccess?: () => void;
}

export const checkRealConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch(`/favicon.png?t=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
};

const OfflineFallback = ({ onRetrySuccess }: OfflineFallbackProps) => {
  const [retryState, setRetryState] = useState<"idle" | "checking" | "success" | "failed">("idle");

  const handleRetry = async () => {
    if (retryState === "checking") return;
    setRetryState("checking");

    const isConnected = await checkRealConnection();

    if (isConnected) {
      setRetryState("success");
      setTimeout(() => {
        if (onRetrySuccess) {
          onRetrySuccess();
        }
        setRetryState("idle");
      }, 600);
    } else {
      setRetryState("failed");
      setTimeout(() => {
        setRetryState("idle");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#04140E] text-[#F5F3EC] flex flex-col items-center justify-between p-4 sm:p-6 text-center relative overflow-hidden font-sans select-none">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(201, 138, 36, 0.12), transparent 55%)"
        }}
      />

      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0 select-none">
        <img src="/favicon.png" alt="" className="w-96 h-96 object-contain" />
      </div>

      {/* Decorative Leaf Motifs */}
      <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
        <Leaf className="w-24 h-24 text-[#C98A24]" />
      </div>
      <div className="absolute bottom-0 left-0 p-8 pointer-events-none opacity-10 rotate-180">
        <Leaf className="w-24 h-24 text-[#C98A24]" />
      </div>

      {/* Top Branding Section */}
      <header className="relative z-10 pt-6 sm:pt-8 flex flex-col items-center gap-1.5">
        <div className="w-14 h-14 bg-[#F1EEE7] rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shadow-xl p-1.5 mb-1">
          <img src="/favicon.png" alt="MM Dairy Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-serif font-black tracking-wide text-[#F5F3EC]">
          MM <span className="text-[#D9A441]">Dairy</span>
        </h1>
        <p className="text-[10px] font-bold text-[#C98A24] uppercase tracking-[0.25em]">
          100% PURE & FRESH
        </p>
      </header>

      {/* Main Centered Offline Card */}
      <main className="relative z-10 my-auto max-w-[420px] w-full bg-[#072017]/90 border border-white/10 rounded-[28px] p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-5">
        
        {/* Arch Illustration with WifiOff */}
        <div className="relative w-44 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-x-2 border-[#C98A24]/30 rounded-t-full bg-gradient-to-b from-[#C98A24]/10 to-transparent" />
          <div className="relative z-10 p-3.5 rounded-full bg-[#0B2E21] border border-[#C98A24]/40 text-[#D9A441] shadow-2xl">
            <WifiOff className="w-9 h-9" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-3xl font-serif font-bold text-[#F5F3EC] tracking-tight">
            You're <span className="text-[#D9A441]">Offline</span>
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-px bg-[#C98A24]/30" />
            <Leaf className="w-3.5 h-3.5 text-[#C98A24]" />
            <div className="w-6 h-px bg-[#C98A24]/30" />
          </div>
        </div>

        {/* Paragraph */}
        <p className="text-xs text-[#AAB8B0] leading-relaxed max-w-xs mx-auto font-medium">
          {retryState === "failed" 
            ? "Still offline. Please check your internet connection and try again."
            : "We couldn't connect to the MMVALI farm right now. Please check your internet connection and try again."}
        </p>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#04140E] border border-white/10 text-xs text-[#AAB8B0] font-medium">
          <span className={`w-2 h-2 rounded-full ${retryState === "failed" ? "bg-amber-500" : "bg-[#D9A441] animate-pulse"}`} />
          {retryState === "failed" ? "Still offline" : "No internet connection"}
        </div>

        {/* Single Action Button (NO Back to Home) */}
        <div className="pt-2">
          <Button 
            onClick={handleRetry}
            disabled={retryState === "checking"}
            className={`w-full h-13 text-xs uppercase tracking-wider font-black rounded-xl shadow-xl flex items-center justify-center gap-2 border transition-all duration-300 ${
              retryState === "success"
                ? "bg-[#16845B] border-[#16845B] text-white"
                : "bg-gradient-to-r from-[#D9A441] via-[#C98A24] to-[#D9A441] hover:brightness-110 text-[#04140E] border-[#D9A441] hover:-translate-y-0.5"
            }`}
          >
            {retryState === "checking" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#04140E]" />
                <span>Checking Connection...</span>
              </>
            )}

            {retryState === "success" && (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Connection Restored</span>
              </>
            )}

            {(retryState === "idle" || retryState === "failed") && (
              <>
                <RotateCw className="w-4 h-4" />
                <span>Retry Connection</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Microcopy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#718078] font-medium pt-1">
          <Leaf className="w-3 h-3 text-[#C98A24]" />
          <span>Your connection to the farm will return when you're back online.</span>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 sm:pb-8 flex flex-col items-center gap-2">
        <Leaf className="w-4 h-4 text-[#C98A24]" />
        <p className="text-[11px] font-medium text-[#718078]">
          © 2026 MMVALI Dairy Farm
        </p>
      </footer>
    </div>
  );
};

export default OfflineFallback;
