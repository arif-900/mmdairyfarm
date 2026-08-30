import React, { useRef } from "react";
import { format } from "date-fns";
import { Download, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
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
  customer_name?: string;
  expected_delivery_date?: string | null;
  shipping_fee?: number | null;
  discount_amount?: number | null;
  promo_code?: string | null;
  order_items?: OrderItem[];
}

interface ShippingLabelModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, isOpen, onClose }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Shipping_Label_${order?.id}`,
  });

  if (!order) return null;

  // Generate an AWB number based on the order ID for realistic display
  const AWB = `MM${order.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const isPrepaid = order.payment_method !== "cod";

  const handleDownloadPDF = async () => {
    if (!labelRef.current) return;

    try {
      toast.loading("Generating Label PDF...");
      
      const element = labelRef.current;
      
      // Force a temporary width to ensure capture isn't clipped by mobile viewport
      const originalStyle = element.style.cssText;
      element.style.width = "105mm";
      element.style.minHeight = "148mm";

      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 396, // 105mm in pixels approx
        height: 559, // 148mm in pixels approx
        onclone: (clonedDoc) => {
          // Ensure cloned element is visible for capture
          const el = clonedDoc.querySelector('[ref="labelRef"]') as HTMLElement;
          if (el) el.style.transform = "none";
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [105, 148], 
      });

      pdf.addImage(imgData, "PNG", 0, 0, 105, 148);
      pdf.save(`shipping-label-${order.id.slice(0, 8)}.pdf`);
      
      toast.dismiss();
      toast.success("Label downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl bg-slate-100">
        <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Shipping Label
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-12 overflow-x-auto flex justify-center items-start min-h-[60vh] bg-slate-200/50">
          
          {/* Responsive Preview Wrapper for Mobile */}
          <div className="origin-top scale-[0.7] sm:scale-[0.85] md:scale-100 transition-transform bg-white shadow-2xl rounded-sm">
             
            <div 
              ref={labelRef} 
              className="bg-white text-black font-sans box-border"
              style={{
                width: "105mm",     // Standard thermal width 4 inches
                minHeight: "148mm", // standard thermal height 6 inches
                padding: "4mm",
              }}
            >
              {/* Outer Border Box */}
              <div className="border-[2px] border-black w-full h-full flex flex-col text-[10px]">
                
                {/* 1. Header Section */}
                <div className="flex border-b-[2px] border-black h-12">
                  <div className="w-[15%] border-r-[2px] border-black flex items-center justify-center font-black text-xs">
                    REG
                  </div>
                  <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2">
                     <div className="text-[9px] font-bold">MMVALI Logistics</div>
                     <div className="font-bold text-[11px]">AWB: {AWB}</div>
                  </div>
                  <div className="w-[25%] flex items-center justify-center font-black text-xs">
                     {isPrepaid ? "PREPAID" : "COD"}
                  </div>
                </div>

                {/* 2. Middle Main Section */}
                <div className="flex border-b-[2px] border-black relative">
                  
                  {/* Left: Barcodes & Dates */}
                  <div className="w-[45%] flex flex-col pt-1 pb-1 border-r-[2px] border-black">
                    <div className="px-2 font-bold text-[9px]">
                      Ordered through<br/>
                      <span className="text-[12px] font-black italic">MMVALI App</span>
                    </div>

                    <div className="flex-1 flex flex-row items-center justify-center h-[180px]">
                      <div className="-rotate-90 origin-center text-[7px] font-bold text-slate-500">
                        (N) IND/AP
                      </div>
                      <div className="-rotate-90 origin-center flex flex-col items-center ml-2">
                        <Barcode 
                          value={AWB} 
                          width={1.2} 
                          height={40} 
                          displayValue={false} 
                          margin={0} 
                        />
                        <div className="text-[9px] font-black mt-1">AWB No. {AWB}</div>
                      </div>
                    </div>

                    <div className="px-2 pb-1 text-[10px] font-bold mt-auto">
                      <div>HBD: {format(new Date(), "dd - MM")}</div>
                      <div>CPD: {order.expected_delivery_date ? format(new Date(order.expected_delivery_date), "dd - MM") : format(new Date(), "dd - MM")}</div>
                    </div>
                  </div>

                  {/* Right: QR Code and Address */}
                  <div className="w-[55%] flex flex-col">
                     <div className="p-2 flex justify-center items-center border-b-[2px] border-black flex-1 min-h-[140px]">
                       <QRCodeSVG value={order.id} size={110} />
                     </div>
                     
                     <div className="p-2 flex-1 text-[9px]">
                       <div className="font-bold pb-1">Shipping/Customer address:</div>
                       <div className="font-bold text-[11px] pb-1">{order.customer_name}</div>
                       <div className="break-words opacity-90 max-w-[95%] pb-1">
                          {order.shipping_address}
                       </div>
                       <div className="font-bold pt-1">Ph: {order.phone}</div>
                     </div>
                  </div>

                </div>

                {/* 3. Seller String */}
                <div className="border-b-[2px] border-black p-2 text-[8px] uppercase font-medium">
                  <div className="font-black">Sold By MMVALI DAIRY FARM</div>
                  <div>Bhanakacherla(V), Pamulapadu(M), Nandyala(D), Andhra Pradesh - 518422</div>
                  <div className="font-black mt-1">FSSAI: 10123018000XXX</div>
                </div>

                {/* 4. Products Table & Invoice Summary */}
                <div className="flex-1 border-b-[2px] border-black flex flex-col min-h-[100px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-[2px] border-black text-[9px] bg-slate-50">
                        <th className="font-bold p-1.5 border-r-[2px] border-black w-[65%]">Item Details</th>
                        <th className="font-bold p-1.5 border-r-[2px] border-black text-center w-[15%]">Qty</th>
                        <th className="font-bold p-1.5 text-center w-[20%]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-[9px] font-medium">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                          <tr key={item.id} className="border-b border-black/10 last:border-0">
                            <td className="p-1.5 border-r-[2px] border-black">
                              {idx + 1}. {item.product_name}
                              {(item.variant_label || (item.selected_weight && item.unit_type)) && (
                                <span className="ml-1 font-black">
                                  ({item.variant_label || `${item.selected_weight}${item.unit_type}`})
                                </span>
                              )}
                            </td>
                            <td className="p-1.5 border-r-[2px] border-black text-center font-bold">{item.quantity}</td>
                            <td className="p-1.5 text-center font-bold">₹{Number(item.price_at_order) * Number(item.quantity)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                            No items found for this record
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Total Summary */}
                  <div className="mt-auto flex border-t-[2px] border-black text-[9px] bg-slate-50/50">
                     <div className="w-[65%] p-2 border-r-[2px] border-black font-black flex items-center text-[9px] uppercase">
                        <div className="text-emerald-700">✓ ONLINE PAYMENT ONLY / PAID ONLINE</div>
                     </div>
                     <div className="w-[35%] p-2 flex flex-col justify-center gap-1">
                        <div className="flex justify-between w-full opacity-80 text-[8px] font-bold">
                           <span>Delivery Fee:</span>
                           <span>₹{order.shipping_fee ?? 0}</span>
                        </div>
                        {!!order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between w-full opacity-80 text-[8px] font-bold">
                             <span>Code {order.promo_code || 'DISC'}:</span>
                             <span className="text-emerald-700">-₹{order.discount_amount}</span>
                          </div>
                        )}
                        <div className="flex justify-between w-full font-black text-[11px] mt-1 pt-1 border-t border-black/20 text-primary">
                           <span>TOTAL:</span>
                           <span>₹{order.total_amount}</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* 5. Footer Barcode */}
                <div className="p-1 pb-0 flex justify-between items-center text-[9px] font-bold">
                   <span>{AWB}</span>
                   <span>Use Transparent Packaging</span>
                </div>
                <div className="flex justify-center my-1 pt-1 border-t-[1px] border-dashed border-black/30 mx-2">
                   <Barcode 
                     value={AWB} 
                     width={1.5} 
                     height={25} 
                     displayValue={false} 
                     margin={0} 
                   />
                </div>
                <div className="flex justify-between items-center p-1 px-2 border-t-[2px] border-black font-bold text-[8.5px]">
                  <span>Not for resale.</span>
                  <span>Printed at {format(new Date(), "HHmm 'hrs', dd/MM/yy")}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-white sm:justify-between items-center gap-4 sticky bottom-0 z-10">
          <p className="text-xs text-muted-foreground mr-auto sm:block hidden font-medium">
            Standard eKart logistics replica. Ensure thermal printer is set to 4x6" size.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/5 text-primary">
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </Button>
            <Button onClick={handlePrint} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white shadow-md">
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          /* This selects whichever element react-to-print scopes to */
          [data-react-to-print] * {
            visibility: visible;
          }
          [data-react-to-print] {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 105mm;
            height: 148mm;
          }
          @page {
            size: 105mm 148mm; /* A6 */
            margin: 0;
          }
        }
      `}} />
    </Dialog>
  );
};
