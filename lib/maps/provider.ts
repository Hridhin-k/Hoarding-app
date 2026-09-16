import { hasPublicEnv, getPublicEnv } from "@/lib/env";
import type { MapProviderName } from "./types";

export function getMapProviderName(): MapProviderName {
  if (!hasPublicEnv()) return "maplibre";
  return getPublicEnv().NEXT_PUBLIC_MAP_PROVIDER;
}
