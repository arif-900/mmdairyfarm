import { ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CircularBackButtonProps {
  onClick: () => void;
  className?: string;
}

export function CircularBackButton({ onClick, className }: CircularBackButtonProps) {
  return (
    <Button
      variant="accent"
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full shadow-lg flex items-center justify-center group transition-all hover:scale-110 active:scale-95 border-2 border-white/50 shrink-0 z-[100]",
        className
      )}
    >
      <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
    </Button>
  );
}
