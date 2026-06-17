// Timestamp formatting honoring the configured time zone (Config → time_zone,
// default Asia/Tokyo). Durations are time-zone independent and stay in status.ts.

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

// formatInstant renders an absolute ISO timestamp in the given IANA time zone,
// e.g. "2026-06-17 12:32:00". Falls back gracefully on bad input/zone.
export function formatInstant(
  iso: string | null | undefined,
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    }).format(date);
    // en-CA yields "2026-06-17, 12:32:00" → drop the comma for compactness.
    return parts.replace(",", "");
  } catch {
    return date.toISOString();
  }
}
