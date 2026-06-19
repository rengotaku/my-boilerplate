import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "running";

export interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  running: "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse",
};

export function StatusBadge({
  tone = "neutral",
  label,
  className,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
