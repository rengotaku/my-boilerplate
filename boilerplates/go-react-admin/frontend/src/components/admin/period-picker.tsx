import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";

export interface PeriodPreset {
  value: string;
  label: string;
}

export interface PeriodPickerProps {
  presets?: PeriodPreset[];
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_PRESETS: PeriodPreset[] = [
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

/** Time-window switch built on Astryx SegmentedControl. */
export function PeriodPicker({
  presets = DEFAULT_PRESETS,
  value,
  onChange,
}: PeriodPickerProps) {
  return (
    <SegmentedControl label="Period" value={value} onChange={onChange} size="sm">
      {presets.map((preset) => (
        <SegmentedControlItem
          key={preset.value}
          value={preset.value}
          label={preset.label}
        />
      ))}
    </SegmentedControl>
  );
}
