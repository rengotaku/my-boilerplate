import type { z } from "zod";
import type {
  runStatusSchema,
  runSchema,
  phaseSchema,
  adminEventSchema,
  logLineSchema,
  metricPointSchema,
  metricSeriesSchema,
  runsResponseSchema,
  runDetailResponseSchema,
  metricsAggregateResponseSchema,
  configResponseSchema,
} from "@/schemas/run";

export type RunStatus = z.infer<typeof runStatusSchema>;
export type Run = z.infer<typeof runSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type AdminEvent = z.infer<typeof adminEventSchema>;
export type LogLine = z.infer<typeof logLineSchema>;
export type MetricPoint = z.infer<typeof metricPointSchema>;
export type MetricSeries = z.infer<typeof metricSeriesSchema>;
export type RunsResponse = z.infer<typeof runsResponseSchema>;
export type RunDetailResponse = z.infer<typeof runDetailResponseSchema>;
export type MetricsAggregateResponse = z.infer<typeof metricsAggregateResponseSchema>;
export type ConfigResponse = z.infer<typeof configResponseSchema>;
