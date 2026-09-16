import {
  canonicalCityName,
  matchCityInDistrict,
  matchDistrictFromAddress,
} from "@/lib/geo/kerala";
import type { GeocodeResult } from "@/lib/maps/types";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  neighbourhood?: string;
  hamlet?: string;
  road?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
};

type NominatimRow = {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

const NOMINATIM_HEADERS = {
  "User-Agent": "HOARDINGS360/0.1 (operations@hoardings360.local)",
};

function fromAddress(address?: NominatimAddress): Pick<GeocodeResult, "city" | "district" | "state" | "locality" | "pincode"> {
  const district = matchDistrictFromAddress([
    address?.county,
    address?.state_district,
    address?.state,
  ]);
  const cityParts = [address?.city, address?.town, address?.municipality, address?.village];
  const city = district ? matchCityInDistrict(district, cityParts) : canonicalCityName(cityParts.find(Boolean) ?? "");
  const locality = address?.suburb || address?.neighbourhood || address?.hamlet || address?.road || "";
  return {
    city: city || undefined,
    district: district || undefined,
    state: address?.state,
    locality: locality || undefined,
    pincode: address?.postcode,
  };
}

function toResult(row: NominatimRow): GeocodeResult {
  return {
    label: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
    ...fromAddress(row.address),
  };
}

export async function geocodeNominatim(query: string): Promise<GeocodeResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  const q = /kerala/i.test(query) ? query : `${query}, Kerala, India`;
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("viewbox", "74.8,12.8,77.5,8.15");
  url.searchParams.set("bounded", "0");

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  const rows = (await response.json()) as NominatimRow[];
  return rows.map(toResult);
}

export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const row = (await response.json()) as NominatimRow & { error?: string };
  if (!row?.lat || row.error) return null;
  return toResult(row);
}
