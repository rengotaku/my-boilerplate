import { z } from "zod";

export const jobViewSchema = z.object({
  id: z.number(),
  name: z.string(),
  kind: z.string(),
  schedule: z.string(),
  enabled: z.boolean(),
  createdAt: z.string(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
  runCount: z.number(),
});

export const jobsResponseSchema = z.object({
  items: z.array(jobViewSchema),
});
