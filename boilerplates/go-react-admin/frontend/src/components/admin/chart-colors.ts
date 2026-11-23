import { useTheme } from "@astryxdesign/core/theme";

/**
 * Astryx data-visualisation tokens, in the order series are drawn.
 *
 * The values are resolved for the active colour mode by useTheme, so charts
 * follow the same light/dark palette as the rest of the screen instead of
 * hard-coding a hex list.
 */
const CHART_TOKEN_NAMES = [
  "--color-data-categorical-indigo",
  "--color-data-categorical-green",
  "--color-data-categorical-orange",
  "--color-data-categorical-red",
  "--color-data-categorical-blue",
  "--color-data-categorical-purple",
  "--color-data-categorical-teal",
  "--color-data-categorical-pink",
] as const;

export function useChartColors(): string[] {
  const { token } = useTheme();
  return CHART_TOKEN_NAMES.map((name) => token(name));
}

/** Cycle the palette so series index N always gets the same colour. */
export function colorForIndex(colors: string[], index: number): string {
  return colors[index % colors.length];
}
