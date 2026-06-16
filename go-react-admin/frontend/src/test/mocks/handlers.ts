import { http, HttpResponse } from "msw";
import type {
  Run,
  RunDetailResponse,
  MetricsAggregateResponse,
  ConfigResponse,
} from "@/types/run";

// Relative "*/api/..." patterns match regardless of the resolved origin, so the
// same handlers work whether VITE_API_BASE_URL is empty (same-origin) or set.

export const mockRuns: Run[] = [
  {
    id: 1,
    jobId: 10,
    jobName: "nightly-export",
    status: "succeeded",
    startedAt: "2026-06-16T01:00:00Z",
    finishedAt: "2026-06-16T01:02:30Z",
    createdAt: "2026-06-16T00:59:00Z",
  },
  {
    id: 2,
    jobId: 11,
    jobName: "sync-users",
    status: "running",
    startedAt: "2026-06-16T02:00:00Z",
    finishedAt: null,
    createdAt: "2026-06-16T01:59:00Z",
  },
  {
    id: 3,
    jobId: 12,
    jobName: "cleanup",
    status: "failed",
    startedAt: "2026-06-16T03:00:00Z",
    finishedAt: "2026-06-16T03:00:45Z",
    createdAt: "2026-06-16T02:59:00Z",
  },
];

export const mockRunDetail: RunDetailResponse = {
  run: mockRuns[0],
  phases: [
    {
      id: 100,
      runId: 1,
      seq: 1,
      name: "extract",
      status: "succeeded",
      startedAt: "2026-06-16T01:00:00Z",
      finishedAt: "2026-06-16T01:01:00Z",
    },
    {
      id: 101,
      runId: 1,
      seq: 2,
      name: "load",
      status: "succeeded",
      startedAt: "2026-06-16T01:01:00Z",
      finishedAt: "2026-06-16T01:02:30Z",
    },
  ],
  events: [
    {
      ts: "2026-06-16T01:00:00Z",
      type: "phase_started",
      phase: "extract",
      status: "running",
    },
    {
      ts: "2026-06-16T01:01:00Z",
      type: "phase_finished",
      phase: "extract",
      status: "succeeded",
    },
  ],
  logs: [
    {
      ts: "2026-06-16T01:00:01Z",
      runId: 1,
      phase: "extract",
      level: "info",
      message: "starting extract",
    },
    {
      ts: "2026-06-16T01:00:30Z",
      runId: 1,
      phase: "extract",
      level: "error",
      message: "transient read error, retrying",
    },
  ],
};

export const mockMetrics: MetricsAggregateResponse = {
  from: "2026-06-15T00:00:00Z",
  to: "2026-06-16T00:00:00Z",
  bucket: "1h",
  series: [
    {
      name: "succeeded",
      points: [
        { ts: "2026-06-15T00:00:00Z", value: 3 },
        { ts: "2026-06-15T01:00:00Z", value: 5 },
      ],
    },
    {
      name: "failed",
      points: [
        { ts: "2026-06-15T00:00:00Z", value: 1 },
        { ts: "2026-06-15T01:00:00Z", value: 0 },
      ],
    },
  ],
};

export const mockConfig: ConfigResponse = {
  port: "8080",
  database_dsn: "file:admin.db",
  log_dir: "/var/log/admin",
  worker_interval: 30,
  shutdown_timeout: 10,
};

export const handlers = [
  http.get("*/api/runs", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const items = status ? mockRuns.filter((r) => r.status === status) : mockRuns;
    return HttpResponse.json({
      items,
      total: items.length,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("page_size") ?? "20"),
    });
  }),

  http.get("*/api/runs/:id", ({ params }) => {
    const id = Number(params.id);
    const run = mockRuns.find((r) => r.id === id);
    if (!run) {
      return HttpResponse.json({ message: "run not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...mockRunDetail, run });
  }),

  http.get("*/api/metrics/aggregate", () => {
    return HttpResponse.json(mockMetrics);
  }),

  http.get("*/api/config", () => {
    return HttpResponse.json(mockConfig);
  }),
];
