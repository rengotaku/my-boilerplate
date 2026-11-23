import { Tab, TabList } from "@astryxdesign/core/TabList";

export interface GroupByOption {
  value: string;
  label: string;
}

export interface GroupByTabsProps {
  options: GroupByOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Metric grouping switch built on Astryx TabList (rendered as a nav strip). */
export function GroupByTabs({ options, value, onChange }: GroupByTabsProps) {
  return (
    <TabList value={value} onChange={onChange} size="sm">
      {options.map((option) => (
        <Tab key={option.value} value={option.value} label={option.label} />
      ))}
    </TabList>
  );
}
