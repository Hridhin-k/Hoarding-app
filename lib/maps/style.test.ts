import { describe, expect, it } from "vitest";
import { DEFAULT_CENTER, MAP_SATELLITE_STYLE, MAP_STREETS_STYLE, mapStyleForBasemap } from "./style";

describe("mapStyleForBasemap", () => {
  it("returns satellite imagery by default", () => {
    expect(typeof mapStyleForBasemap).toBe("function");
    expect(mapStyleForBasemap("satellite")).toBe(MAP_SATELLITE_STYLE);
    expect(MAP_SATELLITE_STYLE.sources.satellite).toBeDefined();
  });

  it("returns street tiles for the map toggle", () => {
    expect(mapStyleForBasemap("streets")).toBe(MAP_STREETS_STYLE);
    expect(MAP_STREETS_STYLE.sources.streets).toBeDefined();
  });

  it("centers Kerala", () => {
    expect(DEFAULT_CENTER.lat).toBeCloseTo(10.16, 1);
    expect(DEFAULT_CENTER.lng).toBeCloseTo(76.64, 1);
  });
});
