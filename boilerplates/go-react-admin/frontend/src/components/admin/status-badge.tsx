import { Badge } from "@astryxdesign/core/Badge";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral" | "running";

export interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
}

const toneToVariant = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  neutral: "neutral",
  running: "info",
} as const;

/** Status pill built on Astryx Badge; running reads as in-progress (info). */
export function StatusBadge({ tone = "neutral", label }: StatusBadgeProps) {
  return <Badge variant={toneToVariant[tone]} label={label} />;
}
