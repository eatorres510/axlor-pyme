import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                "w-full rounded-lg border bg-white dark:bg-etiserv-navyDark text-slate-900 dark:text-white px-3 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-etiserv-blue focus:border-etiserv-blue disabled:opacity-50",
                icon ? "pl-9" : "pl-3",
                error
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 dark:border-white/10",
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-rose-500 mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);
