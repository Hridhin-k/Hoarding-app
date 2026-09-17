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

export type MarketplaceEligibilityGate = {
  id: string;
  label: string;
  ok: boolean;
  hint: string | null;
  href?: string;
};

/** Gates that block Publish even after it would set visibility and publishable. */
export function canAttemptMarketplacePublish(input: MarketplaceEligibilityInput): boolean {
  return isMarketplaceEligible({
    ...input,
    marketplaceVisible: true,
    publishable: true,
  });
}

export function marketplaceEligibilityGates(
  input: MarketplaceEligibilityInput,
  links?: { boardId?: string },
): MarketplaceEligibilityGate[] {
  const gates: MarketplaceEligibilityGate[] = [];

  if (input.organizationStatus && input.organizationStatus !== "active") {
    gates.push({
      id: "organization",
      label: "Organization is active",
      ok: false,
      hint: "This organization is not active on the marketplace.",
    });
  }

  if (input.archived) {
    gates.push({
      id: "archived",
      label: "Face is not archived",
      ok: false,
      hint: "Restore the face before publishing.",
    });
  }

  gates.push(
    {
      id: "lifecycle",
      label: "Board is active",
      ok: input.lifecycleStatus === "active",
      hint:
        input.lifecycleStatus === "active"
          ? null
          : "Only active boards can be listed. Set lifecycle to Active on Overview.",
      href: links?.boardId ? `/manage/boards/${links.boardId}` : undefined,
    },
    {
      id: "publishable",
      label: "Face is publishable",
      ok: input.publishable,
      hint: input.publishable ? null : "Publish will mark this face as publishable.",
    },
    {
      id: "visible",
      label: "Marketplace visibility is on",
      ok: input.marketplaceVisible,
      hint: input.marketplaceVisible ? null : "Publish will list this face on the marketplace.",
    },
    {
      id: "compliance",
      label: "Mandatory compliance is valid",
      ok: !marketplaceBlockedByCompliance(input.compliance),
      hint:
        input.compliance === "expired"
          ? "Mandatory compliance has expired. Renew the permit before publishing."
          : input.compliance === "missing"
            ? "Mandatory compliance is missing. Add a valid permit before publishing."
            : null,
      href: "/manage/compliance",
    },
    {
      id: "occupancy",
      label: "Face is not blocked",
      ok: input.occupancy !== "blocked",
      hint: input.occupancy === "blocked" ? "This face is blocked and cannot be listed." : null,
      href: "/manage/occupancy",
    },
  );

  return gates;
}
