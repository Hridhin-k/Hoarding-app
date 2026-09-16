"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { whileSuppressingAbortErrors } from "@/lib/maps/abort";
import { DEFAULT_CENTER, mapStyleForBasemap } from "@/lib/maps/style";
import type { MapBasemap, MapMarker } from "@/lib/maps/types";

export function MapView({
  markers,
  center,
  zoom = 8,
  onMarkerClick,
  interactive = true,
  className,
}: {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerInstancesRef = useRef<maplibregl.Marker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<MapBasemap>("satellite");
  const skipStyleSwap = useRef(true);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: mapStyleForBasemap("satellite") as unknown as maplibregl.StyleSpecification,
      center: [center?.lng ?? DEFAULT_CENTER.lng, center?.lat ?? DEFAULT_CENTER.lat],
      zoom,
      maxZoom: 19,
      interactive,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const onLoad = () => setReady(true);
    map.once("load", onLoad);

    return () => {
      map.off("load", onLoad);
      markerInstancesRef.current.forEach((marker) => marker.remove());
      markerInstancesRef.current = [];
      whileSuppressingAbortErrors(() => map.remove());
      mapRef.current = null;
      setReady(false);
    };
    // Map instance is created once per mount; center/zoom/markers sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (skipStyleSwap.current) {
      skipStyleSwap.current = false;
      return;
    }
    const onStyle = () => setReady(true);
    setReady(false);
    map.setStyle(mapStyleForBasemap(basemap) as unknown as maplibregl.StyleSpecification);
    map.once("style.load", onStyle);
    return () => {
      map.off("style.load", onStyle);
    };
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || center?.lat == null || center?.lng == null) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center?.lat, center?.lng, zoom, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markerInstancesRef.current.forEach((marker) => marker.remove());
    markerInstancesRef.current = [];

    for (const marker of markers) {
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md ring-2 ring-primary/30";
      el.setAttribute("aria-label", marker.title);
      el.addEventListener("click", () => {
        map.easeTo({ center: [marker.lng, marker.lat], zoom: Math.max(map.getZoom(), 16), duration: 700 });
        onMarkerClickRef.current?.(marker.id);
      });
      const instance = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      markerInstancesRef.current.push(instance);
    }

    if (markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    }
  }, [markers, ready]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className ?? "h-[420px] w-full overflow-hidden rounded-xl border"} />
      <div className="absolute top-3 left-3 flex overflow-hidden rounded-full border bg-white/95 text-xs shadow-sm">
        <button
          type="button"
          className={`px-3 py-1.5 ${basemap === "satellite" ? "bg-primary font-medium text-primary-foreground" : ""}`}
          onClick={() => setBasemap("satellite")}
        >
          Satellite
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 ${basemap === "streets" ? "bg-primary font-medium text-primary-foreground" : ""}`}
          onClick={() => setBasemap("streets")}
        >
          Map
        </button>
      </div>
    </div>
  );
}
