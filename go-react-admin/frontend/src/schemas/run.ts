import { z } from "zod";

export const runStatusSchema = z.enum(["queued", "running", "succeeded", "failed"]);

export const runSchema = z.object({
  id: z.number(),
  jobId: z.number(),
  jobName: z.string(),
  status: runStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const phaseSchema = z.object({
  id: z.number(),
  runId: z.number(),
  seq: z.number(),
  name: z.string(),
  status: runStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
});

export const adminEventSchema = z.object({
  ts: z.string(),
  type: z.enum(["phase_started", "phase_finished"]),
  phase: z.string(),
  status: runStatusSchema,
});

export const logLineSchema = z.object({
  ts: z.string(),
  runId: z.number(),
  phase: z.string(),
  level: z.string(),
  message: z.string(),
});

export const metricPointSchema = z.object({
  ts: z.string(),
  value: z.number(),
});

export const metricSeriesSchema = z.object({
  name: z.string(),
  points: z.array(metricPointSchema),
});

export const runsResponseSchema = z.object({
  items: z.array(runSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const runDetailResponseSchema = z.object({
  run: runSchema,
  phases: z.array(phaseSchema),
  events: z.array(adminEventSchema),
  logs: z.array(logLineSchema),
});

export const metricsAggregateResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  bucket: z.string(),
  series: z.array(metricSeriesSchema),
});

export const configSourceSchema = z.enum(["env", "toml"]);

export const configItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  source: configSourceSchema,
  editable: z.boolean(),
});

export const configResponseSchema = z.object({
  configPath: z.string(),
  items: z.array(configItemSchema),
});

export const updateConfigResponseSchema = z.object({
  workerInterval: z.string(),
  shutdownTimeout: z.string(),
  restartRequired: z.boolean(),
});
