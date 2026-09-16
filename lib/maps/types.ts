export type GeoPoint = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
};

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  state?: string;
  locality?: string;
  pincode?: string;
};

export type MapProviderName = "maplibre" | "google";
export type MapBasemap = "satellite" | "streets";
