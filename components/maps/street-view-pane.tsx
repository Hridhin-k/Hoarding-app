"use client";

import { streetViewEmbedUrl, streetViewOpenUrl } from "@/lib/maps/street-view";
import { cn } from "@/lib/utils";

export function StreetViewPane({
  lat,
  lng,
  className,
  chrome = true,
  emptyLabel = "Street view appears when a site pin is set.",
}: {
  lat?: number | null;
  lng?: number | null;
  className?: string;
  chrome?: boolean;
  emptyLabel?: string;
}) {
  const ready = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const frameClass = cn("relative h-full min-h-[240px] w-full overflow-hidden rounded-md border bg-muted", className);

  if (!ready) {
    return (
      <div className={cn(frameClass, "flex items-center justify-center p-6")} role="status">
        <p className="max-w-xs text-center text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
  const src = streetViewEmbedUrl(lat, lng, key);
  const openHref = streetViewOpenUrl(lat, lng);

  return (
    <div className={frameClass}>
      <iframe
        key={`${lat.toFixed(5)},${lng.toFixed(5)}`}
        title="Street view of this site"
        src={src}
        className="h-full min-h-[240px] w-full border-0"
        allow="fullscreen; accelerometer; gyroscope; geolocation"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {chrome ? (
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="absolute top-3 right-3 z-10 rounded-md border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted"
        >
          Open in Google
        </a>
      ) : null}
    </div>
  );
}
