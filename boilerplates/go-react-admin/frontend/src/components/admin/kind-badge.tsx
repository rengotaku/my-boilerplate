import { Badge } from "@astryxdesign/core/Badge";

export interface KindBadgeProps {
  label: string;
  /** neutral for data, info for values the screen can edit. */
  tone?: "neutral" | "info";
}

/** Small label for a job kind or a setting's source, built on Astryx Badge. */
export function KindBadge({ label, tone = "neutral" }: KindBadgeProps) {
  return <Badge variant={tone} label={label} />;
}
