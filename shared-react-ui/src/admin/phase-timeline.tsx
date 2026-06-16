import * as React from "react";

import { cn } from "@/lib/utils";
import type { StatusTone } from "./status-badge";

export interface PhaseTimelineProps<T> {
  phases: T[];
  getKey: (item: T, index: number) => React.Key;
  getName: (item: T) => React.ReactNode;
  getTone: (item: T) => StatusTone;
  getDuration?: (item: T) => string;
  className?: string;
}

const chipStyles: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  running: "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse",
};

export function PhaseTimeline<T>({
  phases,
  getKey,
  getName,
  getTone,
  getDuration,
  className,
}: PhaseTimelineProps<T>): React.JSX.Element {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {phases.map((phase, index) => {
        const isLast = index === phases.length - 1;
        return (
          <React.Fragment key={getKey(phase, index)}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  chipStyles[getTone(phase)]
                )}
              >
                {getName(phase)}
              </span>
              {getDuration && (
                <span className="text-xs text-slate-400">
                  {getDuration(phase)}
                </span>
              )}
            </div>
            {!isLast && (
              <span aria-hidden className="text-slate-300">
                &rarr;
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
