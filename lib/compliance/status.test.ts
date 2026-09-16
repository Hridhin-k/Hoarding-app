import { describe, expect, it } from "vitest";
import {
  computeComplianceStatus,
  complianceAlertWindow,
  marketplaceBlockedByCompliance,
  rollupBoardCompliance,
} from "@/lib/compliance/status";
import { isMarketplaceEligible, marketplaceBlockReason } from "@/lib/marketplace/eligibility";
import { boardComplianceFromRecords } from "@/lib/compliance/board-compliance";

const asOf = new Date("2026-09-15");

describe("computeComplianceStatus", () => {
  it("returns missing when expiry is absent", () => {
    expect(computeComplianceStatus(null, asOf)).toBe("missing");
    expect(computeComplianceStatus(undefined, asOf)).toBe("missing");
  });

  it("returns expired when expiry is before today", () => {
    expect(computeComplianceStatus("2026-08-01", asOf)).toBe("expired");
    expect(computeComplianceStatus("2026-09-14", asOf)).toBe("expired");
  });

  it("returns expiring within 90 days inclusive", () => {
    expect(computeComplianceStatus("2026-09-15", asOf)).toBe("expiring");
    expect(computeComplianceStatus("2026-10-01", asOf)).toBe("expiring");
    expect(computeComplianceStatus("2026-12-14", asOf)).toBe("expiring");
  });

  it("returns valid when expiry is more than 90 days out", () => {
    expect(computeComplianceStatus("2026-12-15", asOf)).toBe("valid");
    expect(computeComplianceStatus("2027-09-15", asOf)).toBe("valid");
  });
});

describe("complianceAlertWindow", () => {
  it("flags configured day thresholds before expiry", () => {
    expect(complianceAlertWindow("2026-12-14", asOf)).toBe(90);
    expect(complianceAlertWindow("2026-11-14", asOf)).toBe(60);
    expect(complianceAlertWindow("2026-10-15", asOf)).toBe(30);
    expect(complianceAlertWindow("2026-09-30", asOf)).toBe(15);
    expect(complianceAlertWindow("2026-09-22", asOf)).toBe(7);
  });

  it("returns expired or null outside alert windows", () => {
    expect(complianceAlertWindow("2026-08-01", asOf)).toBe("expired");
    expect(complianceAlertWindow("2026-11-20", asOf)).toBe(null);
    expect(complianceAlertWindow(null, asOf)).toBe(null);
  });
});

describe("rollupBoardCompliance", () => {
  it("treats no mandatory records as missing", () => {
    expect(rollupBoardCompliance([])).toBe("missing");
    expect(rollupBoardCompliance([{ is_mandatory: false, status: "valid" }])).toBe("missing");
  });

  it("prioritizes expired over other mandatory states", () => {
    expect(
      rollupBoardCompliance([
        { is_mandatory: true, status: "valid" },
        { is_mandatory: true, status: "expired" },
      ]),
    ).toBe("expired");
  });

  it("surfaces missing and expiring mandatory records", () => {
    expect(rollupBoardCompliance([{ is_mandatory: true, status: "missing" }])).toBe("missing");
    expect(rollupBoardCompliance([{ is_mandatory: true, status: "expiring" }])).toBe("expiring");
    expect(rollupBoardCompliance([{ is_mandatory: true, status: "valid" }])).toBe("valid");
  });
});

describe("marketplaceBlockedByCompliance", () => {
  it("blocks expired and missing mandatory rollup only", () => {
    expect(marketplaceBlockedByCompliance("expired")).toBe(true);
    expect(marketplaceBlockedByCompliance("missing")).toBe(true);
    expect(marketplaceBlockedByCompliance("expiring")).toBe(false);
    expect(marketplaceBlockedByCompliance("valid")).toBe(false);
  });
});

describe("board compliance and marketplace eligibility", () => {
  const base = {
    lifecycleStatus: "active" as const,
    marketplaceVisible: true,
    publishable: true,
    occupancy: "vacant" as const,
  };

  it("allows publication when mandatory compliance is valid or expiring", () => {
    const compliance = boardComplianceFromRecords([{ is_mandatory: true, status: "valid" }]);
    expect(compliance).toBe("valid");
    expect(isMarketplaceEligible({ ...base, compliance })).toBe(true);

    const expiring = boardComplianceFromRecords([{ is_mandatory: true, status: "expiring" }]);
    expect(isMarketplaceEligible({ ...base, compliance: expiring })).toBe(true);
  });

  it("blocks publication when mandatory compliance is expired", () => {
    const compliance = boardComplianceFromRecords([{ is_mandatory: true, status: "expired" }]);
    expect(compliance).toBe("expired");
    expect(isMarketplaceEligible({ ...base, compliance })).toBe(false);
    expect(marketplaceBlockReason({ ...base, compliance })).toMatch(/expired/i);
  });

  it("blocks publication when mandatory compliance is missing", () => {
    const compliance = boardComplianceFromRecords([{ is_mandatory: true, status: "missing" }]);
    expect(isMarketplaceEligible({ ...base, compliance })).toBe(false);
    expect(marketplaceBlockReason({ ...base, compliance })).toMatch(/missing/i);
  });

  it("ignores non-mandatory expired records for rollup", () => {
    const compliance = boardComplianceFromRecords([
      { is_mandatory: false, status: "expired" },
      { is_mandatory: true, status: "valid" },
    ]);
    expect(compliance).toBe("valid");
    expect(isMarketplaceEligible({ ...base, compliance })).toBe(true);
  });
});
