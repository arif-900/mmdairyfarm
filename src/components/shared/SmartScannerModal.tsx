import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScanLine, AlertCircle, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  description?: string;
}

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Smart Package Scanner",
  description = "Point your camera at the QR code or Barcode on the package label."
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader-region";

  useEffect(() => {
    let active = true;
    let startPromise: Promise<any> | null = null;

    const startScanner = async () => {
      if (!isOpen) return;

      setIsInitializing(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        if (!document.getElementById(regionId)) {
           if(active) setError("Scanner viewport failed to load.");
           if(active) setIsInitializing(false);
           return;
        }

        const html5QrCode = new Html5Qrcode(regionId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          verbose: false
        });
        scannerRef.current = html5QrCode;

        startPromise = html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (active) {
              html5QrCode.pause(true);
              onScan(decodedText);
              onClose();
            }
          },
          () => {}
        );

        await startPromise;
      } catch (err: any) {
        if (active) {
          console.error("Scanner startup failed:", err);
          setError("Could not access camera. Please check your browser permissions.");
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    };

    if (isOpen) {
      startScanner();
    }

    return () => {
      active = false;
      const cleanupScanner = async () => {
        if (startPromise) {
          try { await startPromise; } catch (e) {} // Ensure any pending start fully resolves/rejects
        }
        if (scannerRef.current) {
          const qrCode = scannerRef.current;
          scannerRef.current = null;
          try {
            if (qrCode.isScanning) await qrCode.stop();
          } catch (e) {
            console.warn("Scanner stop warning:", e);
          }
          try {
            qrCode.clear();
          } catch (e) {}
        }
      };
      
      cleanupScanner();
    };
  }, [isOpen, onClose, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-2 min-h-[300px] bg-black/5 rounded-xl border border-black/10 overflow-hidden relative">
          
          {error ? (
            <div className="flex flex-col items-center justify-center text-rose-500 gap-3 text-center p-6">
              <AlertCircle className="w-10 h-10" />
              <p className="font-semibold text-sm">{error}</p>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close Scanner
              </Button>
            </div>
          ) : (
            <>
               {isInitializing && (
                 <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col gap-3 items-center justify-center text-white backdrop-blur-sm">
                   <Camera className="w-8 h-8 animate-pulse text-primary" />
                   <span className="text-sm font-medium tracking-widest uppercase">Activating Camera...</span>
                 </div>
               )}
               {/* Container must have exact ID for Html5Qrcode to attach */}
               <div id={regionId} className="w-full max-w-[400px] overflow-hidden rounded-lg [&_video]:object-cover [&_video]:w-full" />
            </>
          )}

        </div>

      </DialogContent>
    </Dialog>
  );
};
