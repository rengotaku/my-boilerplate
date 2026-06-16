import * as React from "react";

import { cn } from "@/lib/utils";

export interface KindBadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export function KindBadge({
  label,
  color,
  className,
}: KindBadgeProps): React.JSX.Element {
  const style: React.CSSProperties | undefined = color
    ? { borderColor: color, color }
    : undefined;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-transparent px-2 py-0.5 text-xs font-medium",
        !color && "border-slate-300 text-slate-700",
        className
      )}
      style={style}
    >
      {label}
    </span>
  );
}
