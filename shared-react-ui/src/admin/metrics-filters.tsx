import * as React from "react";

import { cn } from "@/lib/utils";

export interface FilterField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
}

export interface MetricsFiltersProps {
  fields: FilterField[];
  onChange: (name: string, value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MetricsFilters({
  fields,
  onChange,
  className,
  children,
}: MetricsFiltersProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-wrap items-end gap-4", className)}>
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-500">
            {field.label}
          </span>
          <select
            value={field.value}
            onChange={(e) => onChange(field.name, e.target.value)}
            // appearance-none + a custom right-aligned chevron: native select
            // arrows render inconsistently (and can look misplaced on Linux/GTK).
            className="h-9 appearance-none rounded-md border border-slate-300 bg-white bg-no-repeat py-0 pl-3 pr-9 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
              backgroundPosition: "right 0.625rem center",
              backgroundSize: "1rem",
            }}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {children}
    </div>
  );
}
