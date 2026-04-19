import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
            setIsInstallable(true);
            console.log("PWA: Install prompt captured");
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        
        // Show the install prompt
        installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;
        console.log(`PWA: User choice outcome: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setInstallPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, handleInstall };
};
