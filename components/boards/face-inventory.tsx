import Link from "next/link";
import { DisclosurePanel } from "@/components/disclosure-panel";
import { FaceForm, type FaceFormValues } from "@/components/boards/face-form";
import { PublishFaceButton } from "@/components/boards/publish-face-button";
import { OccupancyBadge } from "@/components/status/status-badge";
import {
  canAttemptMarketplacePublish,
  marketplaceEligibilityGates,
  type MarketplaceEligibilityInput,
} from "@/lib/marketplace/eligibility";
import { formatCardRate, formatFaceSize } from "@/lib/marketplace/public";
import { ILLUMINATION_LABELS, type OccupancyDimension } from "@/lib/types/enums";
import { cn } from "@/lib/utils";

export type FaceInventoryItem = FaceFormValues & {
  area_sqft: number | null;
  occupancy: OccupancyDimension;
};

export function FaceInventory({
  boardId,
  lifecycleStatus,
  compliance,
  faces,
  canEdit,
  canArchive,
  canPublish,
}: {
  boardId: string;
  lifecycleStatus: MarketplaceEligibilityInput["lifecycleStatus"];
  compliance: MarketplaceEligibilityInput["compliance"];
  faces: FaceInventoryItem[];
  canEdit: boolean;
  canArchive: boolean;
  canPublish: boolean;
}) {
  return (
    <ul className="divide-y rounded-md border border-border bg-card">
      {faces.map((face) => {
        const eligibility: MarketplaceEligibilityInput = {
          lifecycleStatus,
          marketplaceVisible: face.marketplace_visible,
          publishable: face.publishable,
          compliance,
          occupancy: face.occupancy,
          archived: Boolean(face.archived_at),
        };
        const gates = marketplaceEligibilityGates(eligibility, { boardId });
        const listed = face.marketplace_visible;
        const publishReady = canAttemptMarketplacePublish(eligibility);

        return (
          <li key={face.id} className="px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{face.face_label}</span>
                  <OccupancyBadge value={face.occupancy} />
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                      listed
                        ? "border-success/25 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {listed ? "Listed" : "Not listed"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatFaceSize(face.width, face.height, "ft", face.area_sqft)}
                  {face.direction ? ` · ${face.direction}` : ""}
                  {` · ${ILLUMINATION_LABELS[face.illumination]}`}
                  {` · ${formatCardRate(face.card_rate)}`}
                </p>
              </div>
              {canPublish && face.id ? (
                <PublishFaceButton faceId={face.id} visible={listed} canPublish={publishReady} />
              ) : null}
            </div>

            <ul className="mt-3 space-y-1.5" aria-label="Marketplace publish checklist">
              {gates.map((gate) => (
                <li key={gate.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 w-4 shrink-0 text-center text-xs" aria-hidden>
                    {gate.ok ? "✓" : "–"}
                  </span>
                  <span>
                    <span className={gate.ok ? "text-muted-foreground" : "text-foreground"}>{gate.label}</span>
                    {!gate.ok && gate.hint ? (
                      <span className="text-muted-foreground"> — {gate.hint}</span>
                    ) : null}
                    {!gate.ok && gate.href && gate.id !== "lifecycle" ? (
                      <>
                        {" "}
                        <Link href={gate.href} className="h360-quiet-link text-xs">
                          Open
                        </Link>
                      </>
                    ) : null}
                  </span>
                  <span className="sr-only">{gate.ok ? "Passed" : "Not met"}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3">
              <DisclosurePanel title="Edit face" nested>
                <FaceForm boardId={boardId} face={face} canEdit={canEdit} canArchive={canArchive} />
              </DisclosurePanel>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
