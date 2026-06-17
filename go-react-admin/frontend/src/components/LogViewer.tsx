import { cn } from "@/lib/utils";
import { formatInstant } from "@/lib/datetime";
import type { LogLine } from "@/types/run";

const LEVEL_COLORS: Record<string, string> = {
  debug: "text-slate-400",
  info: "text-slate-700",
  warn: "text-amber-600",
  warning: "text-amber-600",
  error: "text-red-600",
};

function levelColor(level: string): string {
  return LEVEL_COLORS[level.toLowerCase()] ?? "text-slate-700";
}

export interface LogViewerProps {
  logs: LogLine[];
  emptyMessage?: string;
  className?: string;
  /** IANA time zone for formatting log timestamps. */
  timeZone?: string;
}

export function LogViewer({
  logs,
  emptyMessage = "No logs",
  className,
  timeZone,
}: LogViewerProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-6 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-h-[480px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-xs",
        className
      )}
    >
      {logs.map((log, index) => (
        <div key={index} className="flex gap-2 whitespace-pre-wrap py-0.5">
          <span className="shrink-0 text-slate-500">
            {formatInstant(log.ts, timeZone)}
          </span>
          <span className={cn("shrink-0 uppercase", levelColor(log.level))}>
            {log.level}
          </span>
          <span className="shrink-0 text-indigo-300">[{log.phase}]</span>
          <span className="text-slate-200">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
