import { describe, expect, it } from "vitest";
import { boardBasicsSchema, boardLocationSchema, faceSchema } from "@/lib/validation/schemas";

describe("board inventory validation", () => {
  it("requires board code and name", () => {
    const parsed = boardBasicsSchema.safeParse({
      boardCode: "H",
      name: "A",
      structureType: "hoarding",
      ownershipType: "owned",
      lifecycleStatus: "draft",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires city, district, and state for Kerala locations", () => {
    const missingDistrict = boardLocationSchema.safeParse({
      city: "Kochi",
      state: "Kerala",
    });
    expect(missingDistrict.success).toBe(false);

    const parsed = boardLocationSchema.safeParse({
      city: "Kochi",
      district: "Ernakulam",
      state: "Kerala",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-positive face dimensions", () => {
    const parsed = faceSchema.safeParse({
      faceLabel: "Face A",
      width: 0,
      height: 8,
      unit: "ft",
      illumination: "front_lit",
      publishable: false,
      marketplaceVisible: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a complete face payload", () => {
    const parsed = faceSchema.parse({
      faceLabel: "Face A",
      direction: "North",
      width: 12,
      height: 8,
      unit: "ft",
      illumination: "led",
      cardRate: 180000,
      floorRate: 150000,
      publishable: true,
      marketplaceVisible: false,
    });
    expect(parsed.width).toBe(12);
    expect(parsed.faceLabel).toBe("Face A");
  });
});
