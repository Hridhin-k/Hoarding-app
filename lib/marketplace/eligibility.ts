import type { BoardLifecycle, ComplianceStatus, OccupancyDimension } from "@/lib/types/enums";
import { marketplaceBlockedByCompliance } from "@/lib/compliance/status";

export type MarketplaceEligibilityInput = {
  lifecycleStatus: BoardLifecycle;
  marketplaceVisible: boolean;
  publishable: boolean;
  compliance: ComplianceStatus;
  occupancy: OccupancyDimension;
  archived?: boolean;
  organizationStatus?: "active" | "suspended" | "pending";
};

export function isMarketplaceEligible(input: MarketplaceEligibilityInput): boolean {
  if (input.archived) return false;
  if (input.organizationStatus && input.organizationStatus !== "active") return false;
  if (input.lifecycleStatus !== "active") return false;
  if (!input.marketplaceVisible || !input.publishable) return false;
  if (marketplaceBlockedByCompliance(input.compliance)) return false;
  if (input.occupancy === "blocked") return false;
  return true;
}

export function marketplaceBlockReason(input: MarketplaceEligibilityInput): string | null {
  if (input.archived) {
    return "Archived faces cannot be listed on the marketplace.";
  }
  if (input.organizationStatus && input.organizationStatus !== "active") {
    return "This organization is not active on the marketplace.";
  }
  if (input.lifecycleStatus !== "active") {
    return "Only active boards can be listed on the marketplace.";
  }
  if (!input.publishable) {
    return "This face is not marked as publishable.";
  }
  if (!input.marketplaceVisible) {
    return "Marketplace visibility is turned off for this face.";
  }
  if (input.compliance === "expired") {
    return "Mandatory compliance has expired. Renew the permit before publishing.";
  }
  if (input.compliance === "missing") {
    return "Mandatory compliance is missing. Add a valid permit before publishing.";
  }
  if (input.occupancy === "blocked") {
    return "This face is blocked and cannot be listed.";
  }
  return null;
}
