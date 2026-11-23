import type { ReactNode } from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";

export interface FilterField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
}

export interface MetricsFiltersProps {
  fields: FilterField[];
  onChange: (name: string, value: string) => void;
  children?: ReactNode;
}

/** Row of selector filters built on Astryx Selector. */
export function MetricsFilters({ fields, onChange, children }: MetricsFiltersProps) {
  return (
    <HStack gap={3} align="end" wrap="wrap">
      {fields.map((field) => (
        <Selector
          key={field.name}
          label={field.label}
          options={field.options}
          value={field.value}
          onChange={(value) => onChange(field.name, value)}
          size="sm"
        />
      ))}
      {children}
    </HStack>
  );
}
