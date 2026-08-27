import { useState, useEffect, useCallback } from "react";

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone PWA window
    const checkStandalone = () => {
      const isDisplayStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isTWA = document.referrer.includes("android-app://");

      return isDisplayStandalone || isIOSStandalone || isTWA;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // If not in standalone mode, the site IS installable as a PWA
    if (!standalone) {
      setIsInstallable(true);
    }

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

    (window as any).onPWAInstallable = handler;
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
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
          setInstallPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
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
