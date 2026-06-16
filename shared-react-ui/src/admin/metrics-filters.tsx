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
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
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
