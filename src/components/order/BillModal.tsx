import React, { useRef } from "react";
import { format } from "date-fns";
import { Download, X, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
  selected_weight?: number;
  unit_type?: string;
  variant_label?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_type: string;
  shipping_address: string;
  payment_method: string;
  phone: string;
  order_items: OrderItem[];
  customer_name?: string;
  razorpay_payment_id?: string;
  shipping_fee?: number | null;
}

interface BillModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BillModal: React.FC<BillModalProps> = ({ order, isOpen, onClose }) => {
  const billRef = useRef<HTMLDivElement>(null);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price_at_order * item.quantity), 0);
  const deliveryFee = order.shipping_fee || 0;

  const handleDownloadPDF = async () => {
    const element = pdfCaptureRef.current;
    if (!element) {
      toast.error("Could not locate invoice document template.");
      return;
    }

    try {
      toast.loading("Generating A4 PDF invoice...");

      const canvas = await html2canvas(element, {
        scale: 2, // High DPI capture
        useCORS: true,
        logging: false,
        backgroundColor: "#0B2118",
        windowWidth: 1200, // Forces fixed desktop rendering context
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculate total image height in mm scaled to 210mm A4 width
      const totalImageHeightMM = (canvasHeight * pdfWidth) / canvasWidth;

      let heightLeft = totalImageHeightMM;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalImageHeightMM, undefined, "FAST");
      heightLeft -= pageHeight;

      // Multi-page loop ONLY if items genuinely overflow A4 height (> 5mm threshold)
      while (heightLeft > 5) {
        position -= pageHeight;
        pdf.addPage("a4", "portrait");
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalImageHeightMM, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);
      
      toast.dismiss();
      toast.success("A4 Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DEDICATED OFF-SCREEN FIXED A4 PDF TEMPLATE (210mm x 297mm)             */}
      {/* ALWAYS ACCESSIBLE & 100% IDENTICAL ACROSS ALL PHONES, TABLETS & DESKTOPS */}
      {/* ========================================================================= */}
      <div 
        className="fixed top-0 -left-[9999px] pointer-events-none opacity-100 z-[-9999]"
        aria-hidden="true"
      >
        <div 
          ref={pdfCaptureRef}
          className="bg-[#0B2118] text-[#F5F3EC] p-[14mm] font-sans relative overflow-hidden box-border"
          style={{ 
            width: "210mm", 
            height: "297mm",
            minWidth: "210mm",
            maxWidth: "210mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          }}
        >
          {/* Watermark Seal - Absolute 85mm x 85mm, 3.5% Opacity, Zero Layout Impact */}
          <div 
            className="absolute pointer-events-none z-0 select-none"
            style={{
              left: "50%",
              top: "52%",
              transform: "translate(-50%, -50%)",
              width: "85mm",
              height: "85mm",
              opacity: 0.035
            }}
          >
            <img src="/favicon.png" alt="" className="w-full h-full object-contain block" />
          </div>

          {/* Invoice Content Layer - z-10 above Watermark */}
          <div className="relative z-10 space-y-6">
            {/* Header: Fixed 2-Column Composition */}
            <div className="flex justify-between items-start pb-5 border-b border-white/10">
              <div className="flex gap-4 items-start">
                <div 
                  className="bg-[#F1EEE7] rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0 shadow-md p-1"
                  style={{ width: "20mm", height: "20mm" }}
                >
                  <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#C98A24] tracking-tight mb-0 uppercase leading-none">MMVALI</h1>
                  <p className="text-[10px] font-bold text-[#F5F3EC] uppercase tracking-widest leading-tight mb-1.5 mt-0.5">Dairy Farm</p>
                  <div className="text-[11px] text-[#AAB8B0] leading-relaxed font-medium">
                    <p>Bhanakacherla(V), Pamulapadu(M),</p>
                    <p>Nandyala(D), Andhra Pradesh - 518422</p>
                    <p>Email: mmvalidairyfarm@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-3xl font-black text-white/20 uppercase tracking-tight mb-1">INVOICE</h2>
                <div className="text-xs text-[#AAB8B0] space-y-1 font-medium">
                  <p><span className="text-[#718078]">Order ID:</span> <span className="text-[#C98A24] font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</span></p>
                  <p><span className="text-[#718078]">Date:</span> <span className="text-[#F5F3EC] font-bold">{format(new Date(order.created_at), "PPP")}</span></p>
                  {order.razorpay_payment_id && (
                    <p><span className="text-[#718078]">Transaction:</span> <span className="text-[#F5F3EC] font-bold">{order.razorpay_payment_id}</span></p>
                  )}
                  <p><span className="text-[#718078]">Payment:</span> <span className="text-[#0F8A5F] font-bold uppercase">{order.payment_method}</span></p>
                </div>
              </div>
            </div>

            {/* Billed To / Order Summary: Fixed 2-Column Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-[#10291F] p-4 rounded-xl border border-white/10">
                <h3 className="text-[10px] font-black text-[#C98A24] uppercase tracking-[0.2em] mb-1.5">Billed To</h3>
                <div className="text-[#F5F3EC]">
                  <p className="font-bold text-sm mb-0.5">{order.customer_name || "Valued Customer"}</p>
                  <p className="text-xs text-[#AAB8B0] mb-1 font-medium">Ph: {order.phone}</p>
                  <p className="text-xs leading-relaxed text-[#AAB8B0] whitespace-pre-wrap">{order.shipping_address}</p>
                </div>
              </div>
              <div className="flex flex-col justify-end items-end bg-[#10291F] p-4 rounded-xl border border-white/10">
                <h3 className="text-[10px] font-black text-[#C98A24] uppercase tracking-[0.2em] mb-1.5">Order Summary</h3>
                <div className="text-right space-y-1">
                  <p className="text-xs font-bold text-[#F5F3EC]">{order.delivery_type === 'daily' ? 'Daily Subscription' : 'Standard Delivery'}</p>
                  <p className="text-xs text-[#AAB8B0]">Status: <span className="uppercase text-[#C98A24] font-bold">{order.status}</span></p>
                </div>
              </div>
            </div>

            {/* Items Table: Fixed 4-Column A4 Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2.5 text-[10px] font-black text-[#C98A24] uppercase tracking-widest">Product Details</th>
                    <th className="py-2.5 text-[10px] font-black text-[#C98A24] uppercase tracking-widest text-center">Qty</th>
                    <th className="py-2.5 text-[10px] font-black text-[#C98A24] uppercase tracking-widest text-right">Rate</th>
                    <th className="py-2.5 text-[10px] font-black text-[#C98A24] uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <p className="text-xs font-bold text-[#F5F3EC] mb-0.5">
                          {item.product_name}
                          {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                            <span className="text-[#C98A24] font-bold ml-1.5 opacity-90">
                              ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                            </span>
                          )}
                        </p>
                        <p className="text-[9px] text-[#718078] font-mono">SKU: {item.id.slice(0, 6).toUpperCase()}</p>
                      </td>
                      <td className="py-3 text-xs text-[#F5F3EC] text-center font-bold">{item.quantity}</td>
                      <td className="py-3 text-xs text-[#AAB8B0] text-right font-medium">₹{item.price_at_order.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-xs text-[#C98A24] text-right font-black">₹{(item.price_at_order * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-2">
              <div className="w-[280px] space-y-2">
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="text-[#AAB8B0]">Subtotal</span>
                  <span className="font-bold text-[#F5F3EC]">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="text-[#AAB8B0]">Delivery Fee</span>
                  <span className="font-bold text-[#F5F3EC]">+ ₹{deliveryFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#082D20] border border-[#C98A24]/25 rounded-[12px] text-[#F5F3EC] shadow-xl">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5F3EC]">Total Paid</span>
                  <span className="text-xl font-black text-[#C98A24]">₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 text-center">
              <div className="inline-flex items-center gap-2 mb-1.5">
                <div className="w-8 h-px bg-[#C98A24]/40"></div>
                <p className="text-[11px] font-black text-[#C98A24] uppercase tracking-widest">Quality Guaranteed</p>
                <div className="w-8 h-px bg-[#C98A24]/40"></div>
              </div>
              <p className="text-[11px] text-[#AAB8B0] max-w-[380px] mx-auto leading-relaxed">
                Thank you for supporting your local MMVALI Dairy Farm. Your purchase empowers local farmers and ensures fresh organic dairy for your family.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE SCREEN MODAL UI (RESPONSIVE VIEWING EXPERIENCE)             */}
      {/* ========================================================================= */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-white/10 bg-[#061A13] text-[#F5F3EC] shadow-2xl font-sans">
          <DialogHeader className="p-5 sm:p-6 pb-4 bg-[#082D20] border-b border-white/10 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-black text-[#F5F3EC] flex items-center gap-2.5 uppercase tracking-wide">
                <FileText className="w-6 h-6 text-[#C98A24]" />
                TAX <span className="text-[#C98A24]">INVOICE</span>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-0 overflow-y-auto bg-[#061A13]">
            {/* Interactive Screen Preview Container */}
            <div 
              ref={billRef} 
              className="bg-[#0B2118] text-[#F5F3EC] p-4 sm:p-10 mx-auto my-2 sm:my-4 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl font-sans relative overflow-hidden w-full max-w-full sm:w-[210mm] sm:min-h-[297mm]"
            >
              {/* Watermark with Color Logo */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] z-0 select-none">
                <img src="/favicon.png" alt="" className="w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] rounded-full object-cover" />
              </div>

              <div className="relative z-10 space-y-6 sm:space-y-8">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-white/10">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#F1EEE7] rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0 shadow-md">
                      <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain p-1" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-3xl font-black text-[#C98A24] tracking-tight mb-0 uppercase">MMVALI</h1>
                      <p className="text-[10px] sm:text-xs font-bold text-[#F5F3EC] uppercase tracking-widest leading-tight mb-1">Dairy Farm</p>
                      <div className="text-[11px] sm:text-xs text-[#AAB8B0] leading-relaxed font-medium">
                        <p>Bhanakacherla(V), Pamulapadu(M),</p>
                        <p>Nandyala(D), Andhra Pradesh - 518422</p>
                        <p className="truncate">Email: mmvalidairyfarm@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 w-full sm:w-auto">
                    <h2 className="text-xl sm:text-4xl font-black text-white/20 uppercase tracking-tight mb-1">INVOICE</h2>
                    <div className="text-xs text-[#AAB8B0] space-y-1 font-medium">
                      <p><span className="text-[#718078]">Order ID:</span> <span className="text-[#C98A24] font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</span></p>
                      <p><span className="text-[#718078]">Date:</span> <span className="text-[#F5F3EC] font-bold">{format(new Date(order.created_at), "PPP")}</span></p>
                      {order.razorpay_payment_id && (
                        <p className="truncate"><span className="text-[#718078]">Transaction:</span> <span className="text-[#F5F3EC] font-bold">{order.razorpay_payment_id}</span></p>
                      )}
                      <p><span className="text-[#718078]">Payment:</span> <span className="text-[#0F8A5F] font-bold uppercase">{order.payment_method}</span></p>
                    </div>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-[#10291F] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
                    <h3 className="text-[10px] font-black text-[#C98A24] uppercase tracking-[0.2em] mb-2">Billed To</h3>
                    <div className="text-[#F5F3EC]">
                      <p className="font-bold text-sm sm:text-base mb-1">{order.customer_name || "Valued Customer"}</p>
                      <p className="text-xs text-[#AAB8B0] mb-1.5 font-medium">Ph: {order.phone}</p>
                      <p className="text-xs leading-relaxed text-[#AAB8B0] whitespace-pre-wrap">{order.shipping_address}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end items-start sm:items-end bg-[#10291F] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
                    <h3 className="text-[10px] font-black text-[#C98A24] uppercase tracking-[0.2em] mb-2">Order Summary</h3>
                    <div className="text-left sm:text-right space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-[#F5F3EC]">{order.delivery_type === 'daily' ? 'Daily Subscription' : 'Standard Delivery'}</p>
                      <p className="text-xs text-[#AAB8B0]">Status: <span className="uppercase text-[#C98A24] font-bold">{order.status}</span></p>
                    </div>
                  </div>
                </div>

                {/* Items Table - DESKTOP SCREEN */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="py-3 text-[11px] font-black text-[#C98A24] uppercase tracking-widest">Product Details</th>
                        <th className="py-3 text-[11px] font-black text-[#C98A24] uppercase tracking-widest text-center">Qty</th>
                        <th className="py-3 text-[11px] font-black text-[#C98A24] uppercase tracking-widest text-right">Rate</th>
                        <th className="py-3 text-[11px] font-black text-[#C98A24] uppercase tracking-widest text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {order.order_items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-4">
                            <p className="text-sm font-bold text-[#F5F3EC] mb-0.5">
                              {item.product_name}
                              {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                                <span className="text-[#C98A24] font-bold ml-1.5 opacity-90">
                                  ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-[#718078] font-mono">SKU: {item.id.slice(0, 6).toUpperCase()}</p>
                          </td>
                          <td className="py-4 text-sm text-[#F5F3EC] text-center font-bold">{item.quantity}</td>
                          <td className="py-4 text-sm text-[#AAB8B0] text-right font-medium">₹{item.price_at_order.toLocaleString('en-IN')}</td>
                          <td className="py-4 text-sm text-[#C98A24] text-right font-black">₹{(item.price_at_order * item.quantity).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Items Table - MOBILE SCREEN STACKED */}
                <div className="sm:hidden space-y-3">
                  <p className="text-[10px] font-black text-[#C98A24] uppercase tracking-widest pb-1 border-b border-white/20">
                    Product Details
                  </p>
                  <div className="divide-y divide-white/10">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-[#F5F3EC]">
                            {item.product_name}
                            {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                              <span className="text-[#C98A24] font-bold ml-1">
                                ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                              </span>
                            )}
                          </p>
                          <p className="text-xs font-black text-[#C98A24] shrink-0">
                            ₹{(item.price_at_order * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#AAB8B0]">
                          <span className="font-mono text-[#718078]">SKU: {item.id.slice(0, 6).toUpperCase()}</span>
                          <span>Qty {item.quantity} × ₹{item.price_at_order}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="flex justify-start sm:justify-end pt-2">
                  <div className="w-full sm:max-w-[320px] space-y-2.5">
                    <div className="flex justify-between items-center px-1 text-xs">
                      <span className="text-[#AAB8B0]">Subtotal</span>
                      <span className="font-bold text-[#F5F3EC]">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center px-1 text-xs">
                      <span className="text-[#AAB8B0]">Delivery Fee</span>
                      <span className="font-bold text-[#F5F3EC]">+ ₹{deliveryFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 sm:p-4 bg-[#082D20] border border-[#C98A24]/25 rounded-[14px] text-[#F5F3EC] shadow-xl">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5F3EC]">Total Paid</span>
                      <span className="text-xl sm:text-3xl font-black text-[#C98A24]">₹{order.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 pt-5 text-center">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <div className="w-6 sm:w-8 h-px bg-[#C98A24]/40"></div>
                    <p className="text-[10px] sm:text-xs font-black text-[#C98A24] uppercase tracking-widest">Quality Guaranteed</p>
                    <div className="w-6 sm:w-8 h-px bg-[#C98A24]/40"></div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#AAB8B0] max-w-[400px] mx-auto leading-relaxed">
                    Thank you for supporting your local MMVALI Dairy Farm. Your purchase empowers local farmers and ensures fresh organic dairy for your family.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-5 sm:p-6 border-t border-white/10 bg-[#082D20] sm:justify-between items-center gap-4 sticky bottom-0 z-20">
            <p className="text-[10px] text-[#AAB8B0] mr-auto sm:block hidden font-medium">
              Generated securely by MMVALI Dairy Systems.
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={onClose} className="flex-1 sm:flex-none bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] border border-white/20 font-bold text-xs uppercase tracking-wider h-11 px-6">
                Close
              </Button>
              <Button onClick={handleDownloadPDF} className="flex-1 sm:flex-none bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-xs uppercase tracking-wider h-11 px-8 shadow-xl border border-[#C98A24]">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
