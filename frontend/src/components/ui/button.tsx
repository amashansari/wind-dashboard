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
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variantStyles = {
      default: "bg-primary text-primary-foreground shadow-xs hover:opacity-95",
      destructive:
        "bg-destructive text-destructive-foreground shadow-xs hover:opacity-95",
      outline:
        "border border-border/80 bg-card/80 backdrop-blur-xs text-foreground shadow-2xs hover:bg-muted/80",
      secondary:
        "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80",
      ghost: "hover:bg-muted/70 text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      emerald:
        "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs font-semibold active:scale-[0.98]",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-10 rounded-xl px-7",
      icon: "h-9 w-9 rounded-xl",
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
