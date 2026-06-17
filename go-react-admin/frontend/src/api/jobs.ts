import { apiClient } from "./client";
import { jobViewSchema, jobsResponseSchema } from "@/schemas/job";
import type { JobInput, JobView, JobsResponse } from "@/types/job";

// The client's beforeError hook surfaces the server's { error } text (e.g.
// invalid cron) as the thrown Error message, so callers can show it directly.
export const jobsApi = {
  list: async (): Promise<JobsResponse> => {
    const json = await apiClient.get("api/jobs").json();
    return jobsResponseSchema.parse(json);
  },

  get: async (id: number): Promise<JobView> => {
    const json = await apiClient.get(`api/jobs/${id}`).json();
    return jobViewSchema.parse(json);
  },

  create: async (input: JobInput): Promise<JobView> => {
    const json = await apiClient.post("api/jobs", { json: input }).json();
    return jobViewSchema.parse(json);
  },

  update: async (id: number, input: JobInput): Promise<JobView> => {
    const json = await apiClient.put(`api/jobs/${id}`, { json: input }).json();
    return jobViewSchema.parse(json);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`api/jobs/${id}`);
  },
};
