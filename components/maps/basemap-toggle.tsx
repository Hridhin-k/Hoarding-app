"use client";

import type { MapBasemap } from "@/lib/maps/types";
import { cn } from "@/lib/utils";

export function BasemapToggle({
  basemap,
  onChange,
  className,
}: {
  basemap: MapBasemap;
  onChange: (value: MapBasemap) => void;
  className?: string;
}) {
  return (
    <div className={cn("absolute z-10 flex overflow-hidden rounded-md border bg-card text-xs", className)}>
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
        Streets
      </button>
    </div>
  );
}
