import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-path";

describe("safeInternalPath", () => {
  it("allows relative app paths", () => {
    expect(safeInternalPath("/manage")).toBe("/manage");
    expect(safeInternalPath("/field/jobs/abc")).toBe("/field/jobs/abc");
    expect(safeInternalPath("/onboarding")).toBe("/onboarding");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("//evil.com")).toBe("/manage");
    expect(safeInternalPath("https://evil.com")).toBe("/manage");
    expect(safeInternalPath("/\\evil.com")).toBe("/manage");
    expect(safeInternalPath("/%2F%2Fevil.com")).toBe("/manage");
    expect(safeInternalPath("/manage@evil.com")).toBe("/manage");
  });

  it("uses fallback when empty", () => {
    expect(safeInternalPath(null, "/field")).toBe("/field");
    expect(safeInternalPath("", "/field")).toBe("/field");
  });
});
