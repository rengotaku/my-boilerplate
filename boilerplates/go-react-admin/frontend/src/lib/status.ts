import type { StatusTone } from "@/components/admin/status-badge";
import type { RunStatus } from "@/types/run";

const STATUS_TONE: Record<RunStatus, StatusTone> = {
  succeeded: "success",
  failed: "error",
  running: "running",
  queued: "neutral",
};

export function statusTone(status: RunStatus): StatusTone {
  return STATUS_TONE[status];
}

/** Format an ISO timestamp range into a human-readable duration, or "—". */
export function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}
