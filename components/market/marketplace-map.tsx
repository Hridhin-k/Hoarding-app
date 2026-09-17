"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { STRUCTURE_TYPE_LABELS, type StructureType } from "@/lib/types/enums";
import { formatCardRate } from "@/lib/marketplace/public";
import type { MapMarker } from "@/lib/maps/types";
import { cn } from "@/lib/utils";

export type BoardMapPreview = {
  boardId: string;
  boardName: string;
  city: string;
  locality: string | null;
  structureType: StructureType;
  lat: number;
  lng: number;
  faceSummaries: Array<{ faceLabel: string; cardRate: number | null }>;
};

export function MarketplaceMap({
  boards,
  className,
}: {
  boards: BoardMapPreview[];
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markers: MapMarker[] = useMemo(
    () =>
      boards.map((board) => ({
        id: board.boardId,
        lat: board.lat,
        lng: board.lng,
        title: board.boardName,
        subtitle: board.locality ?? board.city,
      })),
    [boards],
  );

  const selected = boards.find((b) => b.boardId === selectedId) ?? null;

  return (
    <div className={cn("relative h-full min-h-[22rem]", className)}>
      <MapViewLazy
        markers={markers}
        onMarkerClick={setSelectedId}
        framed={false}
        className="h-full min-h-0"
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 xl:inset-x-4 xl:bottom-4">
        {selected ? (
          <div className="pointer-events-auto ml-auto max-w-md rounded-md border bg-card p-3 shadow-sm xl:ml-28">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{STRUCTURE_TYPE_LABELS[selected.structureType]}</p>
                <h2 className="truncate text-sm font-semibold tracking-tight">{selected.boardName}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {[selected.locality, selected.city].filter(Boolean).join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.faceSummaries
                    .slice(0, 2)
                    .map((face) => `${face.faceLabel} · ${formatCardRate(face.cardRate)}`)
                    .join(" · ")}
                  {selected.faceSummaries.length > 2
                    ? ` · +${selected.faceSummaries.length - 2} more`
                    : ""}
                </p>
              </div>
              <Link
                href={`/market/${selected.boardId}`}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View site
              </Link>
            </div>
          </div>
        ) : boards.length ? (
          <p className="max-w-sm rounded-md border bg-card/95 px-3 py-2 text-xs text-muted-foreground xl:ml-28">
            Click a pin to preview a site. Switch to Street view for the road-level look.
          </p>
        ) : (
          <p className="max-w-sm rounded-md border border-dashed bg-card/95 px-3 py-2 text-xs text-muted-foreground">
            No mapped sites on this page. Adjust filters to see inventory on the map.
          </p>
        )}
      </div>
    </div>
  );
}
