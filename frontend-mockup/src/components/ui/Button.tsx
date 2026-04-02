"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700",
  ghost:
    "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600",
  danger:
    "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm",
  outline:
    "border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150 ease-in-out",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : 16} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
