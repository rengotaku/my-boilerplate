import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

export type UserFormData = z.infer<typeof userFormSchema>;
