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
};

const MapView = dynamic(
  () => import("@/components/maps/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-[240px] w-full rounded-xl" />,
  },
);

export function MapViewLazy(props: MapViewProps) {
  return <MapView {...props} />;
}
