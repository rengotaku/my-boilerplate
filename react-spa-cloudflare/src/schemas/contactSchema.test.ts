import { describe, it, expect } from "vitest";
import { contactSchema } from "./contactSchema";

describe("contactSchema", () => {
  it("validates valid contact data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello, this is a test message.",
    };

    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const invalidData = {
      name: "",
      email: "john@example.com",
      message: "Hello",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      message: "Hello",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      message: "",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects message shorter than 10 characters", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hi",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
