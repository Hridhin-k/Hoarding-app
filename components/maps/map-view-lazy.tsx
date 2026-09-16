"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapMarker } from "@/lib/maps/types";

type MapViewProps = {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
  className?: string;
  orientation?: "beside" | "stack";
};

const MapView = dynamic(
  () => import("@/components/maps/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-full min-h-[220px] w-full rounded-md" />
        <Skeleton className="h-full min-h-[220px] w-full rounded-md" />
      </div>
    ),
  },
);

export function MapViewLazy(props: MapViewProps) {
  return <MapView {...props} />;
}
