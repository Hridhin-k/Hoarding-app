import Image from "next/image";
import Link from "next/link";
import { OccupancyBadge } from "@/components/status/status-badge";
import {
  availabilityLabel,
  formatCardRate,
  formatFaceSize,
  startingRate,
  type MarketplaceListing,
} from "@/lib/marketplace";
import { STRUCTURE_TYPE_LABELS, type StructureType } from "@/lib/types/enums";

export function MarketListingCard({
  boardName,
  boardCode,
  boardId,
  city,
  locality,
  landmark,
  structureType,
  faces,
  photoUrl,
  photoCaption,
}: {
  boardName: string;
  boardCode: string;
  boardId: string;
  city: string;
  locality: string | null;
  landmark: string | null;
  structureType: StructureType;
  faces: MarketplaceListing[];
  photoUrl?: string | null;
  photoCaption?: string | null;
}) {
  const place = [landmark, locality, city].filter(Boolean).join(" · ");
  const fromRate = startingRate(faces.map((face) => face.card_rate));
  const href = `/market/${boardId}`;

  return (
    <article className="overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-primary/35">
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={photoCaption || boardName}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 28rem"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[10rem] flex-col justify-end p-3">
              <p className="text-xs font-medium text-muted-foreground">{STRUCTURE_TYPE_LABELS[structureType]}</p>
              <p className="text-sm font-medium">{city}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {STRUCTURE_TYPE_LABELS[structureType]} · {boardCode}
              </p>
              <h2 className="mt-0.5 text-base font-semibold tracking-tight">{boardName}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{place}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{faces.length > 1 ? "From" : "Card rate"}</p>
              <p className="tabular-inr text-base font-semibold">{formatCardRate(fromRate)}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {faces.map((face) => (
              <li key={face.face_id} className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{face.face_label}</span>
                  <OccupancyBadge value={face.occupancy_dimension} />
                </div>
                <p className="mt-1 text-muted-foreground">
                  {formatFaceSize(face.width, face.height, face.unit, face.area_sqft)}
                  {face.direction ? ` · ${face.direction}` : ""}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {availabilityLabel(face.occupancy_dimension, face.available_from)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </article>
  );
}
