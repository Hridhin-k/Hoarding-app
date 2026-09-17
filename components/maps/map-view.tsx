"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { whileSuppressingAbortErrors } from "@/lib/maps/abort";
import { DEFAULT_CENTER, mapStyleForBasemap } from "@/lib/maps/style";
import { resolveStreetViewPoint, streetViewOpenUrl } from "@/lib/maps/street-view";
import type { MapBasemap, MapMarker } from "@/lib/maps/types";
import { BasemapToggle } from "@/components/maps/basemap-toggle";
import { StreetViewPane } from "@/components/maps/street-view-pane";
import { cn } from "@/lib/utils";

type MapPane = "map" | "street";

export function MapView({
  markers,
  center,
  zoom = 8,
  onMarkerClick,
  interactive = true,
  className,
  showStreetView = true,
  framed = true,
}: {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
  className?: string;
  showStreetView?: boolean;
  framed?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerInstancesRef = useRef<maplibregl.Marker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<MapBasemap>("satellite");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pane, setPane] = useState<MapPane>("map");
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
        setFocusedId(marker.id);
        onMarkerClickRef.current?.(marker.id);
      });
      const instance = new maplibregl.Marker({ element: el }).setLngLat([marker.lng, marker.lat]).addTo(map);
      markerInstancesRef.current.push(instance);
    }

    if (markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    }
  }, [markers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || pane !== "map") return;
    const frame = requestAnimationFrame(() => map.resize());
    return () => cancelAnimationFrame(frame);
  }, [pane, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;
    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  const streetView = useMemo(
    () => resolveStreetViewPoint({ center, markers, focusedId }),
    [center, markers, focusedId],
  );

  const showMapPane = pane === "map" || !showStreetView;

  return (
    <div className={cn("relative min-h-[240px]", className)}>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden bg-muted",
          framed && "rounded-md border",
        )}
      >
        <div ref={containerRef} className="h-full w-full" />
        {showMapPane ? (
          <BasemapToggle
            basemap={basemap}
            onChange={setBasemap}
            className="absolute bottom-3 left-3 z-10"
          />
        ) : null}
        {showStreetView ? (
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border bg-card p-0.5" role="tablist" aria-label="Map or street view">
              <button
                type="button"
                role="tab"
                aria-selected={pane === "map"}
                className={cn(
                  "h-8 rounded-[5px] px-3 text-sm",
                  pane === "map" ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
                )}
                onClick={() => setPane("map")}
              >
                Map
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pane === "street"}
                className={cn(
                  "h-8 rounded-[5px] px-3 text-sm",
                  pane === "street" ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
                )}
                onClick={() => setPane("street")}
              >
                Street view
              </button>
            </div>
            {pane === "street" && streetView ? (
              <a
                href={streetViewOpenUrl(streetView.lat, streetView.lng)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border bg-card px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                Open in Google
              </a>
            ) : null}
          </div>
        ) : null}
        {showStreetView && pane === "street" ? (
          <div className="absolute inset-0 z-10 bg-card">
            <StreetViewPane
              lat={streetView?.lat}
              lng={streetView?.lng}
              chrome={false}
              className="h-full min-h-full rounded-none border-0"
              emptyLabel="Click a site pin on the map, then open street view."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
