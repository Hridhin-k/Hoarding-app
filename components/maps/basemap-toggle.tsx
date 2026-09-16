"use client";

import type { MapBasemap } from "@/lib/maps/types";

export function BasemapToggle({
  basemap,
  onChange,
}: {
  basemap: MapBasemap;
  onChange: (value: MapBasemap) => void;
}) {
  return (
    <div className="absolute top-3 left-3 z-10 flex overflow-hidden rounded-lg border bg-white/95 text-xs shadow-sm">
      <button
        type="button"
        className={`px-3 py-1.5 ${basemap === "satellite" ? "bg-primary font-medium text-primary-foreground" : "text-foreground"}`}
        onClick={() => onChange("satellite")}
      >
        Satellite
      </button>
      <button
        type="button"
        className={`px-3 py-1.5 ${basemap === "streets" ? "bg-primary font-medium text-primary-foreground" : "text-foreground"}`}
        onClick={() => onChange("streets")}
      >
        Map
      </button>
    </div>
  );
}
