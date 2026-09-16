import { describe, expect, it } from "vitest";
import { formatFaceIdentity } from "@/lib/boards/format";

describe("formatFaceIdentity", () => {
  it("pairs board name with face label", () => {
    expect(
      formatFaceIdentity({
        boardName: "Statue Junction Hoarding",
        faceLabel: "Face A",
        boardCode: "H360-HZN-001",
      }),
    ).toBe("Statue Junction Hoarding · Face A");
  });

  it("falls back to board code when the name is missing", () => {
    expect(formatFaceIdentity({ boardCode: "H360-HZN-001", faceLabel: "Face B" })).toBe("H360-HZN-001 · Face B");
  });

  it("never returns a UUID-style identifier", () => {
    expect(formatFaceIdentity({ boardName: "Marine Drive Unipole", faceLabel: "Face A" })).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}/i,
    );
  });

  it("returns the board name when the face is board-level", () => {
    expect(formatFaceIdentity({ boardName: "Airport Road LED" })).toBe("Airport Road LED");
  });
});
