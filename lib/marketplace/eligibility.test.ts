import { describe, expect, it } from "vitest";
import {
  canAttemptMarketplacePublish,
  isMarketplaceEligible,
  marketplaceBlockReason,
  marketplaceEligibilityGates,
} from "@/lib/marketplace/eligibility";
import { availabilityLabel, formatCardRate, MARKETPLACE_LISTING_COLUMNS } from "@/lib/marketplace/public";

const eligible = {
  lifecycleStatus: "active" as const,
  marketplaceVisible: true,
  publishable: true,
  compliance: "valid" as const,
  occupancy: "vacant" as const,
};

describe("marketplace eligibility", () => {
  it("allows a published available face", () => {
    expect(isMarketplaceEligible(eligible)).toBe(true);
    expect(marketplaceBlockReason(eligible)).toBeNull();
  });

  it("rejects unpublished faces", () => {
    expect(isMarketplaceEligible({ ...eligible, marketplaceVisible: false })).toBe(false);
    expect(isMarketplaceEligible({ ...eligible, publishable: false })).toBe(false);
  });

  it("rejects expired or missing mandatory compliance", () => {
    expect(isMarketplaceEligible({ ...eligible, compliance: "expired" })).toBe(false);
    expect(isMarketplaceEligible({ ...eligible, compliance: "missing" })).toBe(false);
    expect(marketplaceBlockReason({ ...eligible, compliance: "expired" })).toMatch(/expired/i);
  });

  it("allows expiring compliance while permits are still valid for listing", () => {
    expect(isMarketplaceEligible({ ...eligible, compliance: "expiring" })).toBe(true);
  });

  it("rejects retired boards", () => {
    expect(isMarketplaceEligible({ ...eligible, lifecycleStatus: "retired" })).toBe(false);
    expect(isMarketplaceEligible({ ...eligible, lifecycleStatus: "draft" })).toBe(false);
  });

  it("rejects blocked faces", () => {
    expect(isMarketplaceEligible({ ...eligible, occupancy: "blocked" })).toBe(false);
  });

  it("allows occupied and becoming vacant faces (upcoming vacancy)", () => {
    expect(isMarketplaceEligible({ ...eligible, occupancy: "occupied" })).toBe(true);
    expect(isMarketplaceEligible({ ...eligible, occupancy: "becoming_vacant" })).toBe(true);
    expect(isMarketplaceEligible({ ...eligible, occupancy: "booked_future" })).toBe(true);
  });

  it("rejects archived faces", () => {
    expect(isMarketplaceEligible({ ...eligible, archived: true })).toBe(false);
  });

  it("rejects faces when the tenant is suspended", () => {
    expect(isMarketplaceEligible({ ...eligible, organizationStatus: "suspended" })).toBe(false);
    expect(marketplaceBlockReason({ ...eligible, organizationStatus: "suspended" })).toMatch(/not active/i);
  });

  it("lists publish gates so operators can see what to fix", () => {
    const gates = marketplaceEligibilityGates({
      ...eligible,
      marketplaceVisible: false,
      publishable: false,
      lifecycleStatus: "draft",
      compliance: "missing",
    });
    expect(gates.map((gate) => gate.id)).toEqual([
      "lifecycle",
      "publishable",
      "visible",
      "compliance",
      "occupancy",
    ]);
    expect(gates.filter((gate) => !gate.ok).map((gate) => gate.id)).toEqual([
      "lifecycle",
      "publishable",
      "visible",
      "compliance",
    ]);
    expect(canAttemptMarketplacePublish({ ...eligible, marketplaceVisible: false, publishable: false })).toBe(
      true,
    );
    expect(canAttemptMarketplacePublish({ ...eligible, lifecycleStatus: "draft" })).toBe(false);
    expect(canAttemptMarketplacePublish({ ...eligible, occupancy: "blocked" })).toBe(false);
  });
});

describe("marketplace public presentation", () => {
  it("never includes floor_rate or tenant columns in the public column list", () => {
    expect(MARKETPLACE_LISTING_COLUMNS).not.toMatch(/floor_rate/);
    expect(MARKETPLACE_LISTING_COLUMNS).not.toMatch(/tenant/);
    expect(MARKETPLACE_LISTING_COLUMNS).not.toMatch(/compliance/);
  });

  it("formats pricing and availability for public cards", () => {
    expect(formatCardRate(180000)).toMatch(/1,80,000|180,000/);
    expect(formatCardRate(null)).toMatch(/request/i);
    expect(availabilityLabel("vacant", "2026-09-15")).toMatch(/available now/i);
    expect(availabilityLabel("becoming_vacant", "2027-01-01")).toMatch(/becoming vacant/i);
  });
});
