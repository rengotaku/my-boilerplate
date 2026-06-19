/** Shared default palette for charts. Cycled by series index when no explicit color is given. */
export const CHART_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#a855f7", // purple
  "#14b8a6", // teal
  "#ec4899", // pink
] as const;

export function colorForIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
