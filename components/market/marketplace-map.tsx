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
    <div className={cn("flex h-full min-h-[320px] flex-col gap-3", className)}>
      <MapViewLazy
        markers={markers}
        onMarkerClick={setSelectedId}
        orientation="stack"
        className="h-[280px] w-full overflow-hidden rounded-md border bg-white lg:h-[42%]"
      />
      {selected ? (
        <div className="rounded-md border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{STRUCTURE_TYPE_LABELS[selected.structureType]}</p>
              <h2 className="text-base font-semibold tracking-tight">{selected.boardName}</h2>
              <p className="text-sm text-muted-foreground">
                {[selected.locality, selected.city].filter(Boolean).join(", ")}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {selected.faceSummaries.map((face) => (
                  <li key={face.faceLabel}>
                    {face.faceLabel} · {formatCardRate(face.cardRate)}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={`/market/${selected.boardId}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View site
            </Link>
          </div>
        </div>
      ) : boards.length ? (
        <p className="rounded-md border border-dashed bg-card px-3 py-2 text-sm text-muted-foreground">
          Select a pin to preview a site, then open street view for the road-level look.
        </p>
      ) : (
        <p className="rounded-md border border-dashed bg-card px-3 py-2 text-sm text-muted-foreground">
          No mapped sites on this page. Adjust filters to see inventory on the map.
        </p>
      )}
    </div>
  );
}
