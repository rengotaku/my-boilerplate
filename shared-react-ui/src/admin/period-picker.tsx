import * as React from "react";

import { cn } from "@/lib/utils";

export interface PeriodPreset {
  value: string;
  label: string;
}

export interface PeriodPickerProps {
  presets?: PeriodPreset[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const DEFAULT_PRESETS: PeriodPreset[] = [
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export function PeriodPicker({
  presets = DEFAULT_PRESETS,
  value,
  onChange,
  className,
}: PeriodPickerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1",
        className
      )}
    >
      {presets.map((preset) => {
        const active = preset.value === value;
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
