import { useState, useEffect } from 'react';
import OfflineFallback, { checkRealConnection } from '@/pages/OfflineFallback';

export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      const isConnected = await checkRealConnection();
      if (isConnected) {
        setIsOffline(false);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#04140E]">
      <OfflineFallback onRetrySuccess={() => setIsOffline(false)} />
    </div>
  );
}
