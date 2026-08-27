import { useState, useEffect, useCallback } from "react";

const PWA_INSTALLED_KEY = "mm_pwa_installed";

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone PWA window or previously installed on device
    const checkIsInstalledOnDevice = async () => {
      // Standalone mode checks
      const isDisplayStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isTWA = document.referrer.includes("android-app://");
      const isStoredInstalled = localStorage.getItem(PWA_INSTALLED_KEY) === "true";

      if (isDisplayStandalone || isIOSStandalone || isTWA || isStoredInstalled) {
        setIsStandalone(true);
        setIsInstallable(false);
        return true;
      }

      // Check native browser installed apps API (Chrome/Edge desktop & mobile)
      if ("getInstalledRelatedApps" in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            setIsStandalone(true);
            setIsInstallable(false);
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
            return true;
          }
        } catch (e) {}
      }

      return false;
    };

    checkIsInstalledOnDevice().then((alreadyInstalled) => {
      if (!alreadyInstalled) {
        setIsInstallable(true);
      }
    });

    // 2. Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Check for early beforeinstallprompt event from index.html
    const globalPrompt = (window as any).deferredPWAInstallPrompt;
    if (globalPrompt) {
      setInstallPrompt(globalPrompt);
    }

    // 4. Register beforeinstallprompt event listener
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // 5. Register appinstalled event listener (triggered when user completes PWA install)
    const onAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      localStorage.setItem(PWA_INSTALLED_KEY, "true");
      setInstallPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
    };

    (window as any).onPWAInstallable = handler;
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
      delete (window as any).onPWAInstallable;
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = installPrompt || (window as any).deferredPWAInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem(PWA_INSTALLED_KEY, "true");
          setInstallPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
          setIsStandalone(true);
          setIsInstallable(false);
          return true;
        }
      } catch (err) {
        console.error("PWA install prompt error:", err);
      }
    }
    return false;
  }, [installPrompt]);

  return {
    isInstallable: isInstallable && !isStandalone,
    isIOS,
    isStandalone,
    hasNativePrompt: !!(installPrompt || (window as any)?.deferredPWAInstallPrompt),
    handleInstall,
  };
};
