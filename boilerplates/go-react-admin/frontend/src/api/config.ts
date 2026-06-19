import { apiClient } from "./client";
import { configResponseSchema, updateConfigResponseSchema } from "@/schemas/run";
import type {
  ConfigResponse,
  UpdateConfigInput,
  UpdateConfigResponse,
} from "@/types/run";

export const configApi = {
  get: async (): Promise<ConfigResponse> => {
    const json = await apiClient.get("api/config").json();
    return configResponseSchema.parse(json);
  },

  // update persists the editable (toml) settings. The change is NOT applied to
  // the running process until restart() is called.
  update: async (input: UpdateConfigInput): Promise<UpdateConfigResponse> => {
    const json = await apiClient.put("api/config", { json: input }).json();
    return updateConfigResponseSchema.parse(json);
  },

  // restart asks the server to reload its config. The process drops the current
  // connection while it comes back up.
  restart: async (): Promise<void> => {
    await apiClient.post("api/restart");
  },
};
