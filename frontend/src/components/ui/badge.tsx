import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "lime" | "cyan";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-[#159B76] text-white shadow-2xs",
    secondary: "border-[#E5EAF0] bg-[#F5F7FA] text-[#172033]",
    destructive: "border-red-200 bg-red-50 text-[#DC6262] font-semibold",
    outline: "border-[#E5EAF0] text-[#667085] bg-white",
    success: "border-emerald-200 bg-[#E9F7F1] text-[#159B76] font-semibold",
    warning: "border-amber-200 bg-amber-50 text-[#E8A23A] font-semibold",
    lime: "border-emerald-200 bg-[#E9F7F1] text-[#159B76] font-semibold",
    cyan: "border-blue-200 bg-blue-50 text-[#3989D6] font-semibold",
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
