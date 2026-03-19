"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#18181b] to-[#09090b] text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.28)] disabled:bg-neutral-300",
  secondary:
    "bg-gradient-to-r from-[#F5A623] via-[#f7bb59] to-[#ffd98e] text-[#1A1A1A] shadow-[0_18px_40px_rgba(245,166,35,0.24)] hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(245,166,35,0.32)] disabled:bg-brand/50",
  ghost:
    "bg-white/90 text-slate-700 ring-1 ring-white/80 hover:-translate-y-0.5 hover:bg-white disabled:text-slate-400",
  danger:
    "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_18px_40px_rgba(239,68,68,0.26)] hover:-translate-y-0.5 hover:bg-red-600 disabled:bg-red-300"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
