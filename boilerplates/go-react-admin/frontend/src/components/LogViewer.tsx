import { formatInstant } from "@/lib/datetime";
import type { LogLine } from "@/types/run";

export interface LogViewerProps {
  logs: LogLine[];
  emptyMessage?: string;
  /** IANA time zone for formatting log timestamps. */
  timeZone?: string;
}

/**
 * Dark, scrollable log pane. The palette is fixed (not theme tokens) because
 * the pane is dark in both light and dark mode; index.css owns the colours so
 * contrast stays in one place.
 */
export function LogViewer({ logs, emptyMessage = "No logs", timeZone }: LogViewerProps) {
  if (logs.length === 0) {
    return <div className="log-empty">{emptyMessage}</div>;
  }

  return (
    <div className="log-panel">
      {logs.map((log, index) => (
        <div key={index} className="log-line">
          <span className="log-time">{formatInstant(log.ts, timeZone)}</span>
          <span className={`log-level log-level-${log.level.toLowerCase()}`}>
            {log.level}
          </span>
          <span className="log-phase">[{log.phase}]</span>
          <span className="log-message">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
