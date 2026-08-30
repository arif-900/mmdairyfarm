import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        let IconComponent = Info;
        let iconBgClass = "bg-[#4DA6FF]/15 border-[#4DA6FF]/30 text-[#4DA6FF]";

        if (variant === "success") {
          IconComponent = CheckCircle2;
          iconBgClass = "bg-[#3BC77B]/15 border-[#3BC77B]/30 text-[#3BC77B]";
        } else if (variant === "destructive" || variant === "error") {
          IconComponent = XCircle;
          iconBgClass = "bg-[#FF6B6B]/15 border-[#FF6B6B]/30 text-[#FF6B6B]";
        } else if (variant === "warning") {
          IconComponent = AlertTriangle;
          iconBgClass = "bg-[#FFD166]/15 border-[#FFD166]/30 text-[#FFD166]";
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="grid gap-0.5 flex-1 min-w-0 pr-2">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
