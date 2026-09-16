import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { assertDocumentFile, assertFilename, assertImageFile, storagePath } from "@/lib/storage/validate";

describe("upload validation", () => {
  it("rejects path traversal filenames", () => {
    expect(() => assertFilename("../secret.pdf")).toThrow(AppError);
    expect(() => assertFilename("folder/file.pdf")).toThrow(AppError);
  });

  it("rejects oversized or wrong-type documents", () => {
    const badType = new File([new Uint8Array([1])], "x.exe", { type: "application/octet-stream" });
    expect(() => assertDocumentFile(badType)).toThrow(/PDF|Word|image/i);
  });

  it("accepts jpeg images under size limit", () => {
    const ok = new File([new Uint8Array([1, 2, 3])], "proof.jpg", { type: "image/jpeg" });
    expect(() => assertImageFile(ok)).not.toThrow();
  });

  it("keeps storage paths tenant-prefixed and sanitized", () => {
    expect(storagePath("tenant", "proof", "../x", "a b.jpg")).toBe("tenant/proof/.._x/a_b.jpg");
  });
});
