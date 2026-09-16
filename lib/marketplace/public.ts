import type { IlluminationType, OccupancyDimension, StructureType } from "@/lib/types/enums";

/** Columns safe to expose on public marketplace pages. Never select floor_rate or tenant fields. */
export const MARKETPLACE_LISTING_COLUMNS = [
  "face_id",
  "board_id",
  "board_name",
  "board_code",
  "structure_type",
  "locality",
  "city",
  "district",
  "state",
  "pincode",
  "landmark",
  "latitude",
  "longitude",
  "face_label",
  "direction",
  "width",
  "height",
  "unit",
  "area_sqft",
  "illumination",
  "visibility_notes",
  "card_rate",
  "occupancy_dimension",
  "available_from",
].join(",");

export type MarketplaceListing = {
  face_id: string;
  board_id: string;
  board_name: string;
  board_code: string;
  structure_type: StructureType;
  locality: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  face_label: string;
  direction: string | null;
  width: number;
  height: number;
  unit: string;
  area_sqft: number;
  illumination: IlluminationType;
  visibility_notes: string | null;
  card_rate: number | null;
  occupancy_dimension: OccupancyDimension;
  available_from: string;
};

export type MarketplaceSearchParams = {
  q?: string;
  city?: string;
  locality?: string;
  district?: string;
  type?: string;
  illumination?: string;
  direction?: string;
  minPrice?: string;
  maxPrice?: string;
  minWidth?: string;
  minHeight?: string;
  availability?: string;
  page?: string;
};

export const PAGE_SIZE = 24;

export function formatCardRate(rate: number | null | undefined) {
  if (rate == null) return "Price on request";
  return `₹${Number(rate).toLocaleString("en-IN")}/month`;
}

export function formatAvailableFrom(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function availabilityLabel(dimension: OccupancyDimension, availableFrom: string) {
  if (dimension === "vacant") return "Available now";
  if (dimension === "becoming_vacant") return `Becoming vacant · from ${formatAvailableFrom(availableFrom)}`;
  if (dimension === "booked_future") return `Booked · available ${formatAvailableFrom(availableFrom)}`;
  if (dimension === "occupied") return `Occupied · available ${formatAvailableFrom(availableFrom)}`;
  if (dimension === "on_hold") return `On hold · available ${formatAvailableFrom(availableFrom)}`;
  return formatAvailableFrom(availableFrom);
}

export function formatFaceSize(width: number, height: number, unit: string, areaSqft?: number | null) {
  const size = `${width} × ${height} ${unit}`;
  if (areaSqft == null || Number.isNaN(Number(areaSqft))) return size;
  return `${size} · ${Number(areaSqft).toLocaleString("en-IN")} sq ft`;
}

export function startingRate(rates: Array<number | null | undefined>) {
  const numbers = rates.filter((rate): rate is number => rate != null && Number.isFinite(rate));
  if (!numbers.length) return null;
  return Math.min(...numbers);
}
