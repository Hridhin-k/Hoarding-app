import type { GeoPoint, MapMarker } from "./types";

function isFinitePoint(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function streetViewOpenUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

/** Official Embed API when a browser key is set; otherwise Google’s street-view embed URL. */
export function streetViewEmbedUrl(lat: number, lng: number, apiKey?: string) {
  if (apiKey) {
    const url = new URL("https://www.google.com/maps/embed/v1/streetview");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("fov", "80");
    return url.toString();
  }
  const url = new URL("https://www.google.com/maps");
  url.searchParams.set("layer", "c");
  url.searchParams.set("cbll", `${lat},${lng}`);
  url.searchParams.set("cbp", "11,0,0,0,0");
  url.searchParams.set("output", "svembed");
  return url.toString();
}

export function resolveStreetViewPoint({
  center,
  markers,
  focusedId,
}: {
  center?: GeoPoint;
  markers: Pick<MapMarker, "id" | "lat" | "lng">[];
  focusedId?: string | null;
}): GeoPoint | null {
  const focused = markers.find((marker) => marker.id === focusedId);
  if (focused && isFinitePoint(focused.lat, focused.lng)) {
    return { lat: focused.lat, lng: focused.lng };
  }
  if (center && isFinitePoint(center.lat, center.lng)) {
    return center;
  }
  const first = markers.find((marker) => isFinitePoint(marker.lat, marker.lng));
  return first ? { lat: first.lat, lng: first.lng } : null;
}
