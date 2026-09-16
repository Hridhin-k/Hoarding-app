import type { MarketplaceSearchParams } from "./public";

const LABELS: Record<string, string> = {
  q: "Search",
  district: "District",
  city: "City",
  locality: "Locality",
  type: "Type",
  illumination: "Lighting",
  direction: "Direction",
  minPrice: "Min ₹",
  maxPrice: "Max ₹",
  minWidth: "Min width",
  minHeight: "Min height",
  availability: "Availability",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  now: "Available now",
  upcoming: "Becoming vacant",
  future: "Future availability",
};

export const MARKETPLACE_FILTER_KEYS = [
  "q",
  "district",
  "city",
  "locality",
  "type",
  "illumination",
  "direction",
  "minPrice",
  "maxPrice",
  "minWidth",
  "minHeight",
  "availability",
] as const;

export function activeMarketplaceFilters(params: MarketplaceSearchParams) {
  const chips: Array<{ key: string; label: string }> = [];
  for (const key of MARKETPLACE_FILTER_KEYS) {
    const value = params[key]?.trim();
    if (!value) continue;
    if (key === "availability") {
      chips.push({ key, label: AVAILABILITY_LABELS[value] ?? value });
      continue;
    }
    if (key === "minPrice" || key === "maxPrice") {
      chips.push({ key, label: `${LABELS[key]} ${Number(value).toLocaleString("en-IN")}` });
      continue;
    }
    chips.push({ key, label: `${LABELS[key]}: ${value}` });
  }
  return chips;
}

export function marketplaceHref(params: Record<string, string | undefined>, updates?: Record<string, string | undefined>) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...params, ...updates })) {
    if (key === "page" && updates && !("page" in updates)) continue;
    if (value?.trim()) next[key] = value.trim();
  }
  if (updates && !("page" in updates)) delete next.page;
  const query = new URLSearchParams(next).toString();
  return query ? `/market?${query}` : "/market";
}

export function marketplaceHrefWithout(params: Record<string, string | undefined>, key: string) {
  const next = { ...params };
  delete next[key];
  delete next.page;
  return marketplaceHref(next);
}
