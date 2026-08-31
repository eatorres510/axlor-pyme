import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glass = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl transition-all duration-150",
          "bg-white dark:bg-etiserv-navy border border-slate-200 dark:border-white/10 shadow-card",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
