import { describe, expect, it } from "vitest";
import { resolveStreetViewPoint, streetViewEmbedUrl, streetViewOpenUrl } from "./street-view";

describe("street view URLs", () => {
  it("opens the Google Street View panorama at the viewpoint", () => {
    const url = streetViewOpenUrl(11.176, 75.827);
    expect(url).toContain("map_action=pano");
    expect(url).toContain("11.176,75.827");
  });

  it("uses the Embed API when a browser key is present", () => {
    const url = streetViewEmbedUrl(11.176, 75.827, "test-key");
    expect(url).toContain("https://www.google.com/maps/embed/v1/streetview");
    expect(url).toContain("key=test-key");
    expect(url).toContain("11.176%2C75.827");
  });

  it("falls back to the public street-view embed without a key", () => {
    const url = streetViewEmbedUrl(11.176, 75.827);
    expect(url).toContain("output=svembed");
    expect(url).toContain("cbll=11.176%2C75.827");
    expect(url).toContain("layer=c");
  });
});

describe("resolveStreetViewPoint", () => {
  const markers = [
    { id: "a", lat: 8.5, lng: 76.9 },
    { id: "b", lat: 9.97, lng: 76.28 },
  ];

  it("prefers the focused marker", () => {
    expect(resolveStreetViewPoint({ markers, focusedId: "b", center: { lat: 10, lng: 76 } })).toEqual({
      lat: 9.97,
      lng: 76.28,
    });
  });

  it("uses map center when nothing is focused", () => {
    expect(resolveStreetViewPoint({ markers, center: { lat: 11.176, lng: 75.827 } })).toEqual({
      lat: 11.176,
      lng: 75.827,
    });
  });

  it("uses the first valid marker when there is no center", () => {
    expect(resolveStreetViewPoint({ markers: [{ id: "x", lat: 10.5, lng: 76.2 }] })).toEqual({
      lat: 10.5,
      lng: 76.2,
    });
  });

  it("returns null when there is no usable point", () => {
    expect(resolveStreetViewPoint({ markers: [] })).toBeNull();
    expect(resolveStreetViewPoint({ markers: [{ id: "bad", lat: Number.NaN, lng: 0 }] })).toBeNull();
  });
});
