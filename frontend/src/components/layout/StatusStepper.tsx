import React from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

interface StatusStepperProps {
  steps: Step[];
  currentStepIndex: number;
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  steps,
  currentStepIndex,
  className,
}) => {
  return (
    <div className={clsx("w-full py-3", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div className="flex flex-col items-center group relative">
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-glow-emerald"
                      : isCurrent
                      ? "bg-electric-600 text-white ring-4 ring-electric-500/20 shadow-glow"
                      : "bg-slate-200 dark:bg-navy-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                </div>
                <span
                  className={clsx(
                    "mt-2 text-xs font-semibold text-center whitespace-nowrap",
                    isCurrent
                      ? "text-electric-600 dark:text-electric-400"
                      : isCompleted
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    index < currentStepIndex
                      ? "bg-emerald-600 dark:bg-emerald-500"
                      : "bg-slate-200 dark:bg-navy-800"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
