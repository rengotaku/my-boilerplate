import type { z } from "zod";
import type { jobViewSchema, jobsResponseSchema } from "@/schemas/job";

export type JobView = z.infer<typeof jobViewSchema>;
export type JobsResponse = z.infer<typeof jobsResponseSchema>;

export interface JobInput {
  name: string;
  kind?: string;
  schedule: string;
  enabled?: boolean;
}
