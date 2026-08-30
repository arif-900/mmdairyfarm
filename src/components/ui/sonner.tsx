import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      className="toaster group"
      toastOptions={{
        style: {
          background: "rgba(15, 61, 46, 0.95)",
          borderRadius: "18px",
          border: "1px solid rgba(59, 199, 123, 0.3)",
          color: "#EAFBF1",
          backdropFilter: "blur(12px)",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0F2A3D]/95 group-[.toaster]:text-[#E6F3FF] group-[.toaster]:border-[#4DA6FF]/30 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-[18px] group-[.toaster]:p-4 group-[.toaster]:backdrop-blur-md font-sans",
          description: "group-[.toast]:text-white/80 group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/80",
          success: "!bg-[#0F3D2E]/95 !border-[#3BC77B]/30 !text-[#EAFBF1]",
          error: "!bg-[#3D1717]/95 !border-[#FF6B6B]/30 !text-[#FFECEC]",
          warning: "!bg-[#3D2E0F]/95 !border-[#FFD166]/30 !text-[#FFF6E5]",
          info: "!bg-[#0F2A3D]/95 !border-[#4DA6FF]/30 !text-[#E6F3FF]",
        },
      }}
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-[#3BC77B]" />,
        error: <XCircle className="w-5 h-5 text-[#FF6B6B]" />,
        warning: <AlertTriangle className="w-5 h-5 text-[#FFD166]" />,
        info: <Info className="w-5 h-5 text-[#4DA6FF]" />,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
