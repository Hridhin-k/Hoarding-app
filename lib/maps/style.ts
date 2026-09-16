import type { GeoPoint, MapBasemap } from "./types";

/** Geographic centre of Kerala. */
export const DEFAULT_CENTER: GeoPoint = { lat: 10.1632, lng: 76.6413 };

const ATTRIBUTION_OSM = "&copy; OpenStreetMap contributors";

export const MAP_STREETS_STYLE = {
  version: 8 as const,
  sources: {
    streets: {
      type: "raster" as const,
      tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: `${ATTRIBUTION_OSM} &copy; CARTO`,
      maxzoom: 20,
    },
  },
  layers: [{ id: "streets", type: "raster" as const, source: "streets" }],
};

/** Esri aerial imagery plus road/place labels — real buildings and structures. */
export const MAP_SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Tiles &copy; Esri",
      maxzoom: 19,
    },
    labels: {
      type: "raster" as const,
      tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: `${ATTRIBUTION_OSM} &copy; CARTO`,
      maxzoom: 20,
    },
  },
  layers: [
    { id: "satellite", type: "raster" as const, source: "satellite" },
    { id: "labels", type: "raster" as const, source: "labels" },
  ],
};

export const MAPLIBRE_STYLE = MAP_SATELLITE_STYLE;

export function mapStyleForBasemap(basemap: MapBasemap) {
  return basemap === "streets" ? MAP_STREETS_STYLE : MAP_SATELLITE_STYLE;
}
