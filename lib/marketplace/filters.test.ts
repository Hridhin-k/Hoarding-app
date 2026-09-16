import { describe, expect, it } from "vitest";
import { activeMarketplaceFilters, marketplaceHref, marketplaceHrefWithout } from "./filters";

describe("marketplace filters", () => {
  it("lists only set filters with readable labels", () => {
    expect(
      activeMarketplaceFilters({
        q: "Edappally",
        availability: "now",
        minPrice: "100000",
        city: "",
      }),
    ).toEqual([
      { key: "q", label: "Search: Edappally" },
      { key: "minPrice", label: "Min ₹ 1,00,000" },
      { key: "availability", label: "Available now" },
    ]);
  });

  it("builds listing URLs without empty keys or a stale page", () => {
    expect(marketplaceHref({ q: "Kochi", page: "2" }, { district: "Ernakulam" })).toBe(
      "/market?q=Kochi&district=Ernakulam",
    );
    expect(marketplaceHrefWithout({ q: "Kochi", city: "Kochi" }, "city")).toBe("/market?q=Kochi");
    expect(marketplaceHrefWithout({ q: "Kochi", page: "3" }, "q")).toBe("/market");
  });
});
