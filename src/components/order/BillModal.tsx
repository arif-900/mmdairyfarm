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

  if (!order) return null;

  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price_at_order * item.quantity), 0);
  const deliveryFee = order.shipping_fee || 0;

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;

    try {
      toast.loading("Generating PDF invoice...");
      
      const element = billRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);
      
      toast.dismiss();
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Tax Invoice
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-0 overflow-y-auto bg-slate-100">
          {/* Invoice Container for PDF generation */}
          <div 
            ref={billRef} 
            className="bg-white text-slate-900 p-10 mx-auto my-4 border border-slate-200 rounded-sm shadow-sm font-sans relative overflow-hidden"
            style={{ width: "210mm", minHeight: "297mm" }}
          >
            {/* Watermark with Color Logo */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] z-0 select-none">
              <img src="/favicon.png" alt="" className="w-[450px] h-[450px] rounded-full object-cover" />
            </div>

            <div className="relative z-10">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-10">
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 overflow-hidden">
                    <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-emerald-800 tracking-tighter mb-0">MMVALI</h1>
                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest leading-tight mb-2">Dairy Farm</p>
                    <div className="text-[12px] text-slate-500 leading-relaxed font-medium">
                      <p>Bhanakacherla(V), Pamulapadu(M),</p>
                      <p>Nandyala(D), Andhra Pradesh - 518422</p>
                      <p>Email: mmvalidairyfarm@gmail.com</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter mb-2 -mr-1">Invoice</h2>
                  <div className="text-xs text-slate-600 space-y-1 font-medium">
                    <p><span className="text-slate-400">Order ID:</span> <span className="text-slate-900 font-bold">#{order.id.slice(0, 8).toUpperCase()}</span></p>
                    <p><span className="text-slate-400">Date:</span> <span className="text-slate-900 font-bold">{format(new Date(order.created_at), "PPP")}</span></p>
                    {order.razorpay_payment_id && (
                      <p><span className="text-slate-400">Transaction ID:</span> <span className="text-slate-900 font-bold">{order.razorpay_payment_id}</span></p>
                    )}
                    <p><span className="text-slate-400">Payment:</span> <span className="text-emerald-600 font-bold uppercase">{order.payment_method}</span></p>
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Billed To</h3>
                  <div className="text-slate-800">
                    <p className="font-bold text-lg mb-1">{order.customer_name || "Valued Customer"}</p>
                    <p className="text-sm font-medium text-slate-500 mb-2">Ph: {order.phone}</p>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{order.shipping_address}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end pb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-right">Order Summary</h3>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-slate-800">Standard Delivery</p>
                    <p className="text-xs text-slate-400 italic">Order Status: <span className="uppercase">{order.status}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-12">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                      <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                      <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                      <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-5">
                          <p className="text-sm font-bold text-slate-900 mb-0.5">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium italic">SKU: {item.id.slice(0, 6).toUpperCase()}</p>
                        </td>
                        <td className="py-5 text-sm text-slate-600 text-center font-bold">{item.quantity}</td>
                        <td className="py-5 text-sm text-slate-600 text-right font-medium">₹{item.price_at_order.toLocaleString('en-IN')}</td>
                        <td className="py-5 text-sm text-slate-900 text-right font-black">₹{(item.price_at_order * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-20">
                <div className="w-full max-w-[320px] space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-medium text-slate-400">Subtotal</span>
                    <span className="text-sm font-bold text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-medium text-slate-400">Delivery Fee</span>
                    <span className="text-sm font-bold text-slate-700">+ ₹{deliveryFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-900 rounded-xl text-white shadow-lg shadow-emerald-900/20">
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Total Paid</span>
                    <span className="text-2xl font-black">₹{order.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-slate-100 pt-10 text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-emerald-200"></div>
                  <p className="text-[13px] font-black text-emerald-800 uppercase tracking-widest">Quality Guaranteed</p>
                  <div className="w-8 h-px bg-emerald-200"></div>
                </div>
                <p className="text-xs text-slate-400 max-w-[400px] mx-auto leading-relaxed">
                  Thank you for supporting your local MMVALI Dairy Farm. Your purchase empowers local farmers and ensures fresh dairy for your family.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-white sm:justify-between items-center gap-4 sticky bottom-0 z-10">
          <p className="text-[10px] text-muted-foreground mr-auto sm:block hidden font-medium">
            Generated securely by MMVALI Dairy Systems.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest">
              Close
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest px-8 shadow-md">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
