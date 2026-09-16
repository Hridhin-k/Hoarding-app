import { describe, expect, it } from "vitest";
import {
  KERALA_DISTRICTS,
  canonicalCityName,
  citiesInDistrict,
  isCatalogCity,
  matchDistrictFromAddress,
  placeCenter,
} from "@/lib/geo/kerala";

describe("Kerala place catalog", () => {
  it("covers all 14 districts", () => {
    expect(KERALA_DISTRICTS).toHaveLength(14);
    expect(new Set(KERALA_DISTRICTS.map((d) => d.name)).size).toBe(14);
  });

  it("lists cities only for the selected district", () => {
    const ernakulam = citiesInDistrict("Ernakulam").map((c) => c.name);
    expect(ernakulam).toContain("Kochi");
    expect(ernakulam).toContain("Aluva");
    expect(ernakulam).not.toContain("Kannur");
    expect(citiesInDistrict("unknown")).toEqual([]);
  });

  it("resolves aliases and city centers", () => {
    expect(canonicalCityName("Cochin")).toBe("Kochi");
    expect(canonicalCityName("Trivandrum")).toBe("Thiruvananthapuram");
    expect(isCatalogCity("Ernakulam", "Kochi")).toBe(true);
    expect(isCatalogCity("Ernakulam", "Kannur")).toBe(false);
    const center = placeCenter("Ernakulam", "Kochi");
    expect(center?.lat).toBeCloseTo(9.93, 1);
  });

  it("matches OSM district names to the catalog", () => {
    expect(matchDistrictFromAddress(["Ernakulam", "Kerala"])).toBe("Ernakulam");
    expect(matchDistrictFromAddress(["unknown county"])).toBe("");
  });
});
