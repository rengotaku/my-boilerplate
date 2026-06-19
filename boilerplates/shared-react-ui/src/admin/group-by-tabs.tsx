import * as React from "react";

import { cn } from "@/lib/utils";

export interface GroupByOption {
  value: string;
  label: string;
}

export interface GroupByTabsProps {
  options: GroupByOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GroupByTabs({
  options,
  value,
  onChange,
  className,
}: GroupByTabsProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
