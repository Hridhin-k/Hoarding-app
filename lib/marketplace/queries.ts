import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signedUrlAdmin } from "@/lib/storage/signed-url";
import {
  PAGE_SIZE,
  type MarketplaceListing,
  type MarketplaceSearchParams,
} from "@/lib/marketplace/public";

export async function searchMarketplaceListings(params: MarketplaceSearchParams) {
  const supabase = await createClient();
  const page = Math.max(1, Number(params.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("marketplace_listings")
    .select("*", { count: "exact" })
    .order("city")
    .order("board_name")
    .range(from, to);

  if (params.city?.trim()) query = query.ilike("city", `%${params.city.trim()}%`);
  if (params.district?.trim()) query = query.ilike("district", `%${params.district.trim()}%`);
  if (params.locality?.trim()) query = query.ilike("locality", `%${params.locality.trim()}%`);
  if (params.type) query = query.eq("structure_type", params.type);
  if (params.illumination) query = query.eq("illumination", params.illumination);
  if (params.direction?.trim()) query = query.ilike("direction", `%${params.direction.trim()}%`);
  if (params.minPrice) query = query.gte("card_rate", Number(params.minPrice));
  if (params.maxPrice) query = query.lte("card_rate", Number(params.maxPrice));
  if (params.minWidth) query = query.gte("width", Number(params.minWidth));
  if (params.minHeight) query = query.gte("height", Number(params.minHeight));

  const today = new Date().toISOString().slice(0, 10);
  if (params.availability === "now") {
    query = query.eq("occupancy_dimension", "vacant").lte("available_from", today);
  } else if (params.availability === "upcoming") {
    query = query.eq("occupancy_dimension", "becoming_vacant");
  } else if (params.availability === "future") {
    query = query.in("occupancy_dimension", ["booked_future", "occupied", "becoming_vacant"]);
  }

  if (params.q?.trim()) {
    const term = params.q.trim();
    query = query.or(
      `board_name.ilike.%${term}%,locality.ilike.%${term}%,city.ilike.%${term}%,direction.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) return { listings: [] as MarketplaceListing[], total: 0, page, pageSize: PAGE_SIZE };
  return {
    listings: toPublicListings(data ?? []),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

function toPublicListings(rows: Array<Record<string, unknown>>): MarketplaceListing[] {
  return rows.map((row) => ({
    face_id: String(row.face_id),
    board_id: String(row.board_id),
    board_name: String(row.board_name),
    board_code: String(row.board_code),
    structure_type: row.structure_type as MarketplaceListing["structure_type"],
    locality: (row.locality as string | null) ?? null,
    city: String(row.city),
    district: (row.district as string | null) ?? null,
    state: String(row.state),
    pincode: (row.pincode as string | null) ?? null,
    landmark: (row.landmark as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    face_label: String(row.face_label),
    direction: (row.direction as string | null) ?? null,
    width: Number(row.width),
    height: Number(row.height),
    unit: String(row.unit),
    area_sqft: Number(row.area_sqft),
    illumination: row.illumination as MarketplaceListing["illumination"],
    visibility_notes: (row.visibility_notes as string | null) ?? null,
    card_rate: row.card_rate == null ? null : Number(row.card_rate),
    occupancy_dimension: row.occupancy_dimension as MarketplaceListing["occupancy_dimension"],
    available_from: String(row.available_from),
  }));
}

/** Dedupes metadata + page fetches for the same board in one request. */
export const getMarketplaceBoard = cache(async (boardId: string) => {
  const supabase = await createClient();
  const { data: faces } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("board_id", boardId)
    .order("face_label");

  if (!faces?.length) return null;
  return toPublicListings(faces as Array<Record<string, unknown>>);
});

export async function getMarketplaceBoardPhotos(boardId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_photos")
    .select("id, board_id, face_id, storage_path, caption, is_primary, sort_order")
    .eq("board_id", boardId)
    .order("sort_order");

  const photos = data ?? [];
  return Promise.all(
    photos.map(async (photo) => {
      let url: string | null = null;
      try {
        url = await signedUrlAdmin("board-images", photo.storage_path as string, 3600);
      } catch {
        url = null;
      }
      return {
        id: photo.id as string,
        caption: (photo.caption as string | null) ?? null,
        isPrimary: Boolean(photo.is_primary),
        url,
      };
    }),
  );
}

export async function getMarketplaceCoverPhotos(boardIds: string[]) {
  const unique = [...new Set(boardIds.filter(Boolean))];
  const covers = new Map<string, { url: string; caption: string | null }>();
  if (!unique.length) return covers;

  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_photos")
    .select("board_id, storage_path, caption, is_primary, sort_order")
    .in("board_id", unique);

  const chosen = new Map<string, { storage_path: string; caption: string | null; is_primary: boolean; sort_order: number }>();
  for (const row of data ?? []) {
    const boardId = String(row.board_id);
    const next = {
      storage_path: String(row.storage_path),
      caption: (row.caption as string | null) ?? null,
      is_primary: Boolean(row.is_primary),
      sort_order: Number(row.sort_order ?? 0),
    };
    const current = chosen.get(boardId);
    if (!current) {
      chosen.set(boardId, next);
      continue;
    }
    if (Number(next.is_primary) > Number(current.is_primary) || (next.is_primary === current.is_primary && next.sort_order < current.sort_order)) {
      chosen.set(boardId, next);
    }
  }

  await Promise.all(
    [...chosen.entries()].map(async ([boardId, photo]) => {
      try {
        const url = await signedUrlAdmin("board-images", photo.storage_path, 3600);
        if (url) covers.set(boardId, { url, caption: photo.caption });
      } catch {
        /* listing still renders without a photo */
      }
    }),
  );
  return covers;
}

export function groupListingsByBoard(listings: MarketplaceListing[]) {
  const map = new Map<
    string,
    {
      boardId: string;
      boardName: string;
      boardCode: string;
      city: string;
      locality: string | null;
      latitude: number | null;
      longitude: number | null;
      structureType: MarketplaceListing["structure_type"];
      faces: MarketplaceListing[];
    }
  >();

  for (const row of listings) {
    const existing = map.get(row.board_id);
    if (existing) {
      existing.faces.push(row);
      continue;
    }
    map.set(row.board_id, {
      boardId: row.board_id,
      boardName: row.board_name,
      boardCode: row.board_code,
      city: row.city,
      locality: row.locality,
      latitude: row.latitude,
      longitude: row.longitude,
      structureType: row.structure_type,
      faces: [row],
    });
  }

  return [...map.values()];
}
