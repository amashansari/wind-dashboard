import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-primary text-primary-foreground shadow-2xs",
    secondary: "border-border/60 bg-secondary/80 text-secondary-foreground",
    destructive: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold",
    outline: "border-border/70 text-foreground bg-card/40 backdrop-blur-xs",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
