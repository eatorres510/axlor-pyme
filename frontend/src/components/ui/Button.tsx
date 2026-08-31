import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  glow = false,
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variants = {
    primary: "bg-etiserv-blue hover:bg-etiserv-blueHover text-white focus:ring-etiserv-blue shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-slate-100 border border-slate-200 dark:border-white/10",
    outline: "border border-slate-300 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 focus:ring-slate-400",
    danger: "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500",
    ghost: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 focus:ring-slate-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm gap-2",
    icon: "p-2 text-xs",
  };

  const glowStyles = glow ? "shadow-glow hover:shadow-glow" : "";

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], glowStyles, className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};
