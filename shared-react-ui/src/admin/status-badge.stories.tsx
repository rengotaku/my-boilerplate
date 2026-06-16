import type { Story } from "@ladle/react";
import { StatusBadge, type StatusTone } from "./status-badge";

export default {
  title: "Admin / StatusBadge",
};

const tones: StatusTone[] = [
  "success",
  "warning",
  "error",
  "info",
  "neutral",
  "running",
];

export const AllTones: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    {tones.map((tone) => (
      <StatusBadge key={tone} tone={tone} label={tone} />
    ))}
  </div>
);

export const Default: Story = () => <StatusBadge label="neutral default" />;
