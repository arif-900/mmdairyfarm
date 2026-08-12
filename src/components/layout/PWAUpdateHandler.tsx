import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAUpdateHandler() {
  const {
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodic check every 30 minutes
        const intervalId = setInterval(() => {
          if (navigator.onLine) {
            r.update().catch(err => console.log('PWA periodic update check:', err));
          }
        }, 30 * 60 * 1000);

        // Check on app visibility (e.g. when customer returns to PWA from background on phone)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            r.update().catch(err => console.log('PWA visibility update check:', err));
          }
        };

        const handleOnline = () => {
          r.update().catch(err => console.log('PWA online update check:', err));
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('online', handleOnline);
        };
      }
    },
    onNeedRefresh() {
      // Force service worker to update and activate immediately
      updateServiceWorker(true);
    },
    onRegisterError(error) {
      console.error('PWA registration error:', error);
    },
  });

  // Listen for service worker controller change to perform controlled single reload
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let refreshing = false;

      const handleControllerChange = () => {
        if (refreshing) return;

        // Prevent disruptive reload if user is in checkout or sensitive flow
        const isSensitiveRoute = 
          window.location.pathname.includes('/order') || 
          window.location.pathname.includes('/cart') ||
          window.location.pathname.includes('/checkout');

        if (isSensitiveRoute) {
          toast({
            title: "✨ MM Dairy Updated",
            description: "A new version of the application is ready.",
            action: (
              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-[#C98A24] text-[#061A13] hover:bg-[#D9A441] font-bold text-xs shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Update Now
              </Button>
            ),
          });
        } else {
          const RELOAD_KEY = 'mm_pwa_auto_reloaded';
          const lastReload = sessionStorage.getItem(RELOAD_KEY);
          const now = Date.now();

          // Only reload if not reloaded in the last 15 seconds to prevent reload loops
          if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
            refreshing = true;
            sessionStorage.setItem(RELOAD_KEY, now.toString());
            window.location.reload();
          }
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null;
}

export default PWAUpdateHandler;
