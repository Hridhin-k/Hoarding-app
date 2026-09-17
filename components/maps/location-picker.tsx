"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { whileSuppressingAbortErrors } from "@/lib/maps/abort";
import { DEFAULT_CENTER, mapStyleForBasemap } from "@/lib/maps/style";
import type { GeocodeResult, MapBasemap } from "@/lib/maps/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BasemapToggle } from "@/components/maps/basemap-toggle";
import { StreetViewPane } from "@/components/maps/street-view-pane";

function pinElement() {
  const wrap = document.createElement("div");
  wrap.className = "relative h-9 w-7 cursor-grab";
  wrap.innerHTML =
    '<span class="absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full border-[3px] border-white bg-primary shadow-lg"></span><span class="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1 rotate-45 bg-primary"></span>';
  return wrap;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  onResolvedAddress,
  className,
}: {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (point: { lat: number; lng: number }) => void;
  onResolvedAddress?: (place: GeocodeResult) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const onResolvedRef = useRef(onResolvedAddress);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<MapBasemap>("satellite");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const paneClass = className ?? "h-[360px] w-full overflow-hidden rounded-xl border bg-muted";

  useEffect(() => {
    onChangeRef.current = onChange;
    onResolvedRef.current = onResolvedAddress;
  }, [onChange, onResolvedAddress]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyleForBasemap("satellite") as unknown as maplibregl.StyleSpecification,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 8,
      maxZoom: 19,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-left");
    mapRef.current = map;
    map.once("load", () => setReady(true));

    map.on("click", (event) => {
      onChangeRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      void reverse(event.lngLat.lat, event.lngLat.lng);
    });

    return () => {
      markerRef.current = null;
      mapRef.current = null;
      whileSuppressingAbortErrors(() => map.remove());
    };
  }, []);

  const skipStyleSwap = useRef(true);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (skipStyleSwap.current) {
      skipStyleSwap.current = false;
      return;
    }
    const onStyle = () => setReady(true);
    markerRef.current = null;
    setReady(false);
    map.setStyle(mapStyleForBasemap(basemap) as unknown as maplibregl.StyleSpecification);
    map.once("style.load", onStyle);
    return () => {
      map.off("style.load", onStyle);
    };
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || latitude == null || longitude == null) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ element: pinElement(), draggable: true, anchor: "bottom" })
        .setLngLat([longitude, latitude])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const next = markerRef.current?.getLngLat();
        if (!next) return;
        onChangeRef.current({ lat: next.lat, lng: next.lng });
        void reverse(next.lat, next.lng);
      });
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
    map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 16) });
  }, [latitude, longitude, ready]);

  async function reverse(lat: number, lng: number) {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) return;
      const row = (await response.json()) as GeocodeResult | null;
      if (row) onResolvedRef.current?.(row);
    } catch {
      /* pin is still set */
    }
  }

  async function searchPlace() {
    if (query.trim().length < 3) {
      setStatus("Type at least 3 characters.");
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        setStatus("Could not search. Try tapping the map instead.");
        return;
      }
      const rows = (await response.json()) as GeocodeResult[];
      setResults(rows);
      setStatus(rows.length ? null : "No places found. Tap the satellite map to drop a pin.");
    } finally {
      setPending(false);
    }
  }

  function applyResult(row: GeocodeResult) {
    onChangeRef.current({ lat: row.lat, lng: row.lng });
    onResolvedRef.current?.(row);
    setResults([]);
    setQuery(row.label);
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setStatus("This browser cannot share GPS.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPending(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChangeRef.current({ lat, lng });
        void reverse(lat, lng);
      },
      () => {
        setPending(false);
        setStatus("Allow location access, or tap the map.");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchPlace();
            }
          }}
          placeholder="Search a junction, mall, or road in Kerala"
          className="max-w-sm"
          aria-label="Search place"
        />
        <Button type="button" variant="outline" onClick={() => void searchPlace()} disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </Button>
        <Button type="button" variant="outline" onClick={useDeviceLocation} disabled={pending}>
          Use my location
        </Button>
      </div>
      {results.length ? (
        <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border bg-card p-2 text-sm">
          {results.map((row) => (
            <li key={`${row.lat}-${row.lng}-${row.label}`}>
              <button type="button" className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted" onClick={() => applyResult(row)}>
                {row.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="relative">
          <div
            ref={containerRef}
            className={paneClass}
            role="application"
            aria-label="Location picker map"
          />
          <BasemapToggle basemap={basemap} onChange={setBasemap} className="absolute top-3 left-3 z-10" />
        </div>
        <StreetViewPane
          lat={latitude}
          lng={longitude}
          className={paneClass}
          emptyLabel="Drop a pin on the map to open street view of this site."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Satellite shows real buildings. Street view shows the road-level look of the structure. Tap to drop the pin, then
        drag it onto the site.
      </p>
      {status ? <p className="text-xs text-destructive">{status}</p> : null}
    </div>
  );
}
