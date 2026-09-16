"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type MarketPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

export function ListingGallery({
  photos,
  boardName,
}: {
  photos: MarketPhoto[];
  boardName: string;
}) {
  const [activeId, setActiveId] = useState(photos[0]?.id ?? "");
  const active = photos.find((photo) => photo.id === activeId) ?? photos[0];

  if (!active) {
    return (
      <div className="flex h-56 items-center justify-center rounded-md border border-dashed bg-card text-sm text-muted-foreground">
        Site photos will appear when the media owner publishes them.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-md border bg-muted sm:h-80 lg:h-[420px]">
        <Image
          src={active.url}
          alt={active.caption || boardName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
          unoptimized
        />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveId(photo.id)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border",
                photo.id === active.id ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
              aria-label={photo.caption || `Photo of ${boardName}`}
              aria-pressed={photo.id === active.id}
            >
              <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
