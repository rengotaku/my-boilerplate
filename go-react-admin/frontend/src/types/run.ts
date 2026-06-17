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
  configItemSchema,
  configResponseSchema,
  updateConfigResponseSchema,
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
export type ConfigItem = z.infer<typeof configItemSchema>;
export type ConfigResponse = z.infer<typeof configResponseSchema>;
export type UpdateConfigResponse = z.infer<typeof updateConfigResponseSchema>;

export interface UpdateConfigInput {
  worker_interval?: string;
  shutdown_timeout?: string;
  time_zone?: string;
}
