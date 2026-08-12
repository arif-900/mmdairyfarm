import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-soft hover:shadow-card",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 shadow-soft",
        secondary: "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-100/60",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
        accent: "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-soft hover:shadow-card",
        hero: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-elevated text-base font-semibold px-8 py-3.5 rounded-2xl hover:scale-[1.02]",
        heroOutline: "border border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-base font-semibold px-8 py-3.5 rounded-2xl hover:scale-[1.02]",
        whatsapp: "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-soft hover:shadow-card font-semibold",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-7 text-base rounded-xl",
        xl: "h-14 px-9 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
