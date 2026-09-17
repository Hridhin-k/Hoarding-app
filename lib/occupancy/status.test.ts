import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  availableFromDate,
  faceOccupancyDimension,
  occupancyConflictMessage,
  occupancyConflicts,
  occupancyStateForRequestedDates,
  rangesOverlap,
  statesConflict,
  summarizeOccupancyDimensions,
} from "@/lib/occupancy/status";
import { isMarketplaceEligible, marketplaceBlockReason } from "@/lib/marketplace/eligibility";
import { roleHasPermission } from "@/lib/permissions/catalog";

const asOf = new Date("2026-09-15");

describe("rangesOverlap", () => {
  it("treats inclusive ranges as overlapping on shared boundary days", () => {
    expect(rangesOverlap(new Date("2026-10-01"), new Date("2026-10-31"), new Date("2026-10-31"), new Date("2026-11-30"))).toBe(
      true,
    );
  });

  it("allows adjacent periods that touch on the day after end", () => {
    expect(rangesOverlap(new Date("2026-10-01"), new Date("2026-10-31"), new Date("2026-11-01"), new Date("2026-12-31"))).toBe(
      false,
    );
  });
});

describe("occupancyConflicts", () => {
  it("detects overlapping occupied and booked_future periods", () => {
    const conflicts = occupancyConflicts(
      { start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" },
      [{ id: "1", start_date: "2026-11-01", end_date: "2026-11-30", state: "booked_future" }],
    );
    expect(conflicts).toHaveLength(1);
    expect(occupancyConflictMessage("occupied", conflicts)).toMatch(/occupied or reserved/i);
  });

  it("allows adjacent non-overlapping reservation periods", () => {
    const conflicts = occupancyConflicts(
      { start_date: "2027-01-01", end_date: "2027-03-31", state: "occupied" },
      [{ id: "1", start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" }],
    );
    expect(conflicts).toHaveLength(0);
  });

  it("blocks holds overlapping occupied periods", () => {
    const conflicts = occupancyConflicts(
      { start_date: "2026-10-15", end_date: "2026-10-20", state: "on_hold" },
      [{ id: "1", start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" }],
    );
    expect(conflicts).toHaveLength(1);
  });

  it("blocks overlapping blocked maintenance windows", () => {
    const conflicts = occupancyConflicts(
      { start_date: "2026-10-10", end_date: "2026-10-12", state: "blocked" },
      [{ id: "1", start_date: "2026-10-01", end_date: "2026-10-31", state: "blocked" }],
    );
    expect(conflicts).toHaveLength(1);
  });

  it("ignores the record being edited", () => {
    const conflicts = occupancyConflicts(
      { id: "1", start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" },
      [{ id: "1", start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" }],
    );
    expect(conflicts).toHaveLength(0);
  });

  it("allows future booking after current occupancy ends", () => {
    const conflicts = occupancyConflicts(
      { start_date: "2027-01-01", end_date: "2027-03-31", state: "booked_future" },
      [{ id: "1", start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" }],
    );
    expect(conflicts).toHaveLength(0);
  });
});

describe("statesConflict", () => {
  it("reserves occupied and booked_future from each other", () => {
    expect(statesConflict("occupied", "booked_future")).toBe(true);
  });
});

describe("faceOccupancyDimension", () => {
  it("marks a face becoming vacant inside the prelisting window", () => {
    const status = faceOccupancyDimension(
      [{ id: "1", start_date: "2026-08-01", end_date: "2026-10-05", state: "occupied" }],
      asOf,
      30,
    );
    expect(status).toBe("becoming_vacant");
  });

  it("returns occupied when follow-on booking exists", () => {
    const status = faceOccupancyDimension(
      [
        { id: "1", start_date: "2026-08-01", end_date: "2026-10-05", state: "occupied" },
        { id: "2", start_date: "2026-10-06", end_date: "2026-12-31", state: "booked_future" },
      ],
      asOf,
      30,
    );
    expect(status).toBe("occupied");
  });

  it("returns vacant when there is no covering period", () => {
    expect(faceOccupancyDimension([], asOf)).toBe("vacant");
  });

  it("returns vacant after occupancy has expired", () => {
    expect(
      faceOccupancyDimension(
        [{ id: "1", start_date: "2026-01-01", end_date: "2026-08-01", state: "occupied" }],
        asOf,
      ),
    ).toBe("vacant");
  });

  it("returns on_hold when a hold covers today", () => {
    expect(
      faceOccupancyDimension(
        [{ id: "1", start_date: "2026-09-01", end_date: "2026-09-30", state: "on_hold" }],
        asOf,
      ),
    ).toBe("on_hold");
  });

  it("returns booked_future when only a future reservation exists", () => {
    expect(
      faceOccupancyDimension(
        [{ id: "1", start_date: "2026-11-01", end_date: "2027-01-31", state: "booked_future" }],
        asOf,
      ),
    ).toBe("booked_future");
  });

  it("returns blocked when maintenance block covers today", () => {
    expect(
      faceOccupancyDimension(
        [{ id: "1", start_date: "2026-09-01", end_date: "2026-09-30", state: "blocked" }],
        asOf,
      ),
    ).toBe("blocked");
  });
});

describe("availableFromDate", () => {
  it("computes available-from as the day after last reservation", () => {
    const date = availableFromDate(
      [{ start_date: "2026-10-01", end_date: "2026-12-31", state: "occupied" }],
      asOf,
    );
    expect(format(date, "yyyy-MM-dd")).toBe("2027-01-01");
  });

  it("returns today when no future reservations remain", () => {
    const date = availableFromDate(
      [{ start_date: "2026-01-01", end_date: "2026-08-01", state: "occupied" }],
      asOf,
    );
    expect(format(date, "yyyy-MM-dd")).toBe("2026-09-15");
  });
});

describe("compliance and occupancy independence", () => {
  const base = {
    lifecycleStatus: "active" as const,
    marketplaceVisible: true,
    publishable: true,
    occupancy: "occupied" as const,
  };

  it("can be active, compliance expired, and occupied at the same time for eligibility math", () => {
    expect(isMarketplaceEligible({ ...base, compliance: "expired" })).toBe(false);
    expect(isMarketplaceEligible({ ...base, compliance: "valid" })).toBe(true);
    expect(marketplaceBlockReason({ ...base, compliance: "expired" })).toMatch(/compliance/i);
  });

  it("blocks marketplace only for blocked occupancy, not for occupied", () => {
    expect(isMarketplaceEligible({ ...base, compliance: "valid", occupancy: "occupied" })).toBe(true);
    expect(isMarketplaceEligible({ ...base, compliance: "valid", occupancy: "blocked" })).toBe(false);
  });
});

describe("permissions", () => {
  it("keeps technicians off financial and admin permissions", () => {
    expect(roleHasPermission("TECHNICIAN", "field.view")).toBe(true);
    expect(roleHasPermission("TECHNICIAN", "occupancy.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "team.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "marketplace.publish")).toBe(false);
    expect(roleHasPermission("SALES", "marketplace.publish")).toBe(true);
    expect(roleHasPermission("COMPLIANCE", "enquiries.manage")).toBe(false);
  });
});

describe("occupancyStateForRequestedDates", () => {
  it("books current or past starts as occupied and future starts as booked_future", () => {
    expect(occupancyStateForRequestedDates("2026-09-15", asOf)).toBe("occupied");
    expect(occupancyStateForRequestedDates("2026-09-14", asOf)).toBe("occupied");
    expect(occupancyStateForRequestedDates("2026-09-16", asOf)).toBe("booked_future");
  });
});

describe("summarizeOccupancyDimensions", () => {
  it("lists face occupancy counts in operational order", () => {
    expect(summarizeOccupancyDimensions([])).toBe("No faces");
    expect(summarizeOccupancyDimensions(["occupied", "vacant", "vacant", "becoming_vacant"])).toBe(
      "1 occupied · 1 becoming vacant · 2 vacant",
    );
  });
});

