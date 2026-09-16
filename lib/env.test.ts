import { describe, expect, it } from "vitest";
import { publicEnvSchema, serverEnvSchema } from "@/lib/env";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
  NEXT_PUBLIC_MAP_PROVIDER: "maplibre",
};

describe("environment validation", () => {
  it("accepts hosted public credentials", () => {
    const parsed = publicEnvSchema.parse(validPublic);
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(parsed.NEXT_PUBLIC_MAP_PROVIDER).toBe("maplibre");
  });

  it("rejects a missing anon key", () => {
    const parsed = publicEnvSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-URL supabase host", () => {
    const parsed = publicEnvSchema.safeParse({
      ...validPublic,
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });
    expect(parsed.success).toBe(false);
  });

  it("does not require the service role key for public env", () => {
    const parsed = serverEnvSchema.parse(validPublic);
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it("treats blank optional secrets as unset", () => {
    const parsed = serverEnvSchema.parse({
      ...validPublic,
      SUPABASE_SERVICE_ROLE_KEY: "",
    });
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });
});
