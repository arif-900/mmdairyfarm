import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const DISMISS_KEY = "mm_pwa_install_banner_dismissed_v3";

const InstallBanner = () => {
  const { isInstallable, isIOS, isStandalone, handleInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
      setDismissed(isDismissed);
    } catch (e) {
      setDismissed(false);
    }
  }, []);

  if (!isInstallable || isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch (e) {}
  };

  const onDirectInstallClick = async () => {
    await handleInstall();
    handleDismiss();
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#0B2118] text-[#F5F3EC] rounded-2xl p-4 shadow-2xl border border-[#C98A24]/40 relative overflow-hidden backdrop-blur-md">
        <button
          onClick={handleDismiss}
          aria-label="Close install prompt"
          className="absolute top-3 right-3 text-[#9AAFA4] hover:text-[#F5F3EC] p-1 rounded-lg transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-11 h-11 rounded-xl bg-[#10291F] border border-[#C98A24]/30 flex items-center justify-center text-[#C98A24] shrink-0 shadow-md mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#C98A24] text-[#061A13] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                MM DAIRY APP
              </span>
              <h3 className="font-extrabold text-xs text-[#F5F3EC]">
                Install App for Faster Orders
              </h3>
            </div>

            <p className="text-[11px] text-[#9AAFA4] leading-tight">
              Enjoy 1-tap access, daily morning delivery updates & offline mode.
            </p>

            {isIOS ? (
              <div className="pt-2 flex items-center gap-2 text-[10px] text-[#C98A24] font-bold bg-[#10291F] p-2 rounded-lg border border-white/10 mt-2">
                <span>To Install: Tap</span>
                <Share className="w-3.5 h-3.5 inline text-[#C98A24]" />
                <span>Share then</span>
                <PlusSquare className="w-3.5 h-3.5 inline text-[#C98A24]" />
                <span>"Add to Home Screen"</span>
              </div>
            ) : (
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={onDirectInstallClick}
                  size="sm"
                  className="bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-xs uppercase tracking-wider h-9 px-5 rounded-xl shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Install App
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Subtle decorative gold glow */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#C98A24]/10 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
};

export default InstallBanner;
