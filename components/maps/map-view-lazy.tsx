"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapMarker } from "@/lib/maps/types";
import { cn } from "@/lib/utils";

type MapViewProps = {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
  className?: string;
  showStreetView?: boolean;
  framed?: boolean;
};

const MapView = dynamic(
  () => import("@/components/maps/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-[240px] w-full rounded-md" />,
  },
);

export function MapViewLazy({ className, ...props }: MapViewProps) {
  return (
    <div className={cn("min-h-[240px]", className)}>
      <MapView {...props} className="h-full" />
    </div>
  );
}
