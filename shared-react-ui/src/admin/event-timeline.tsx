import * as React from "react";

import { cn } from "@/lib/utils";
import type { StatusTone } from "./status-badge";

export interface EventTimelineProps<T> {
  items: T[];
  getKey: (item: T, index: number) => React.Key;
  getTimestamp: (item: T) => string;
  getTitle: (item: T) => React.ReactNode;
  getTone?: (item: T) => StatusTone;
  renderDetail?: (item: T) => React.ReactNode;
  className?: string;
}

const dotColors: Record<StatusTone, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
  running: "bg-indigo-500 animate-pulse",
};

export function EventTimeline<T>({
  items,
  getKey,
  getTimestamp,
  getTitle,
  getTone,
  renderDetail,
  className,
}: EventTimelineProps<T>): React.JSX.Element {
  return (
    <ol className={cn("relative flex flex-col", className)}>
      {items.map((item, index) => {
        const tone: StatusTone = getTone ? getTone(item) : "neutral";
        const isLast = index === items.length - 1;
        return (
          <li key={getKey(item, index)} className="flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-3 w-3 shrink-0 rounded-full",
                  dotColors[tone]
                )}
              />
              {!isLast && <span className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400">
                {getTimestamp(item)}
              </span>
              <span className="text-sm font-medium text-slate-800">
                {getTitle(item)}
              </span>
              {renderDetail && (
                <div className="text-sm text-slate-600">
                  {renderDetail(item)}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
