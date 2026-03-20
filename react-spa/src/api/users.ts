import { apiClient } from "./client";
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";

export const usersApi = {
  getAll: () => apiClient.get("users").json<User[]>(),

  getById: (id: string) => apiClient.get(`users/${id}`).json<User>(),

  create: (input: CreateUserInput) =>
    apiClient.post("users", { json: input }).json<User>(),

  update: (id: string, input: UpdateUserInput) =>
    apiClient.put(`users/${id}`, { json: input }).json<User>(),

  delete: (id: string) => apiClient.delete(`users/${id}`),
};
