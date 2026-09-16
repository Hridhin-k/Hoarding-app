"use client";

import { streetViewEmbedUrl, streetViewOpenUrl } from "@/lib/maps/street-view";
import { cn } from "@/lib/utils";

export function StreetViewPane({
  lat,
  lng,
  className,
  emptyLabel = "Street view appears when a site pin is set.",
}: {
  lat?: number | null;
  lng?: number | null;
  className?: string;
  emptyLabel?: string;
}) {
  const ready = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const frameClass = cn(
    "relative min-h-[240px] w-full overflow-hidden rounded-xl border bg-muted",
    className,
  );

  if (!ready) {
    return (
      <div className={cn(frameClass, "flex items-center justify-center p-4")} role="status">
        <p className="text-center text-sm text-muted-foreground">{emptyLabel}</p>
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
      <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-lg border bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
        Street view
      </span>
      <a
        href={openHref}
        target="_blank"
        rel="noreferrer"
        className="absolute top-3 right-3 z-10 rounded-lg border bg-white/95 px-3 py-1.5 text-xs text-foreground shadow-sm hover:bg-white"
      >
        Open in Google
      </a>
    </div>
  );
}
