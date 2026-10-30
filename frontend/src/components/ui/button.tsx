import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "emerald";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159B76] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      default: "bg-[#159B76] text-white shadow-xs hover:bg-[#128363] font-medium",
      destructive:
        "bg-[#DC6262] text-white shadow-xs hover:bg-[#C85252] font-medium",
      outline:
        "border border-[#E5EAF0] bg-white text-[#172033] shadow-2xs hover:bg-[#F5F7FA] font-medium",
      secondary:
        "bg-[#F5F7FA] text-[#172033] border border-[#E5EAF0] hover:bg-[#E5EAF0] font-medium",
      ghost: "hover:bg-[#F5F7FA] text-[#172033] font-medium",
      link: "text-[#159B76] underline-offset-4 hover:underline",
      emerald:
        "bg-[#159B76] hover:bg-[#128363] text-white shadow-xs font-semibold",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-10 rounded-lg px-6",
      icon: "h-9 w-9 rounded-lg",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
