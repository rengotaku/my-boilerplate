import { http, HttpResponse } from "msw";
import type {
  Run,
  RunDetailResponse,
  MetricsAggregateResponse,
  ConfigResponse,
} from "@/types/run";
import type { JobView } from "@/types/job";

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

export const mockJobs: JobView[] = [
  {
    id: 10,
    name: "nightly-export",
    kind: "task",
    schedule: "0 2 * * *",
    enabled: true,
    createdAt: "2026-06-01T00:00:00Z",
    lastRunAt: "2026-06-16T01:00:00Z",
    nextRunAt: "2026-06-17T02:00:00Z",
    runCount: 12,
  },
  {
    id: 11,
    name: "sync-users",
    kind: "task",
    schedule: "@every 20s",
    enabled: false,
    createdAt: "2026-06-02T00:00:00Z",
    lastRunAt: null,
    nextRunAt: null,
    runCount: 0,
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
  configPath: "config.toml",
  items: [
    { key: "port", label: "Port", value: "8084", source: "env", editable: false },
    {
      key: "database_dsn",
      label: "Database DSN",
      value: "file:admin.db",
      source: "env",
      editable: false,
    },
    {
      key: "log_dir",
      label: "Log directory",
      value: "/var/log/admin",
      source: "env",
      editable: false,
    },
    {
      key: "worker_interval",
      label: "Worker interval",
      value: "30s",
      source: "toml",
      editable: true,
    },
    {
      key: "shutdown_timeout",
      label: "Shutdown timeout",
      value: "10s",
      source: "toml",
      editable: true,
    },
    {
      key: "time_zone",
      label: "Time zone",
      value: "Asia/Tokyo",
      source: "toml",
      editable: true,
    },
  ],
};

export const handlers = [
  http.get("*/api/runs", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const jobId = url.searchParams.get("job_id");
    let items = mockRuns;
    if (status) items = items.filter((r) => r.status === status);
    if (jobId) items = items.filter((r) => r.jobId === Number(jobId));
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

  http.get("*/api/jobs", () => {
    return HttpResponse.json({ items: mockJobs });
  }),

  http.post("*/api/jobs", async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      kind?: string;
      schedule?: string;
      enabled?: boolean;
    };
    if (!body.name) {
      return HttpResponse.json({ error: "name is required" }, { status: 400 });
    }
    const job: JobView = {
      id: 99,
      name: body.name,
      kind: body.kind ?? "task",
      schedule: body.schedule ?? "",
      enabled: body.enabled ?? true,
      createdAt: "2026-06-17T00:00:00Z",
      lastRunAt: null,
      nextRunAt: null,
      runCount: 0,
    };
    return HttpResponse.json(job, { status: 201 });
  }),

  http.get("*/api/jobs/:id", ({ params }) => {
    const id = Number(params.id);
    const job = mockJobs.find((j) => j.id === id);
    if (!job) {
      return HttpResponse.json({ error: "job not found" }, { status: 404 });
    }
    return HttpResponse.json(job);
  }),

  http.put("*/api/jobs/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const job = mockJobs.find((j) => j.id === id);
    if (!job) {
      return HttpResponse.json({ error: "job not found" }, { status: 404 });
    }
    const body = (await request.json()) as {
      name?: string;
      kind?: string;
      schedule?: string;
      enabled?: boolean;
    };
    return HttpResponse.json({
      ...job,
      name: body.name ?? job.name,
      kind: body.kind ?? job.kind,
      schedule: body.schedule ?? job.schedule,
      enabled: body.enabled ?? job.enabled,
    });
  }),

  http.delete("*/api/jobs/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/metrics/aggregate", () => {
    return HttpResponse.json(mockMetrics);
  }),

  http.get("*/api/config", () => {
    return HttpResponse.json(mockConfig);
  }),

  http.put("*/api/config", async ({ request }) => {
    const body = (await request.json()) as {
      worker_interval?: string;
      shutdown_timeout?: string;
    };
    return HttpResponse.json({
      workerInterval: body.worker_interval ?? "30s",
      shutdownTimeout: body.shutdown_timeout ?? "10s",
      restartRequired: true,
    });
  }),

  http.post("*/api/restart", () => {
    return HttpResponse.json({ status: "restarting" }, { status: 202 });
  }),
];
