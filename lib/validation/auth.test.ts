import { describe, expect, it } from "vitest";
import { profileSchema, resetPasswordSchema, signupSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("requires a matching password confirmation", () => {
    const parsed = resetPasswordSchema.safeParse({
      password: "Password123!",
      confirmPassword: "Password123",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a profile name", () => {
    const parsed = profileSchema.parse({ fullName: "Arun Menon", phone: "" });
    expect(parsed.fullName).toBe("Arun Menon");
  });

  it("rejects a short signup password", () => {
    const parsed = signupSchema.safeParse({
      fullName: "Arun Menon",
      email: "arun@example.com",
      password: "short",
    });
    expect(parsed.success).toBe(false);
  });
});
