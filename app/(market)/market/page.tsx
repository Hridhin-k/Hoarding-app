import type { Metadata } from "next";
import Link from "next/link";
import { MarketSearch } from "@/components/market/search";
import { MarketplaceMap } from "@/components/market/marketplace-map";
import {
  availabilityLabel,
  formatCardRate,
  groupListingsByBoard,
  searchMarketplaceListings,
} from "@/lib/marketplace";
import {
  ILLUMINATION_LABELS,
  STRUCTURE_TYPE_LABELS,
  type IlluminationType,
  type StructureType,
} from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse published outdoor advertising inventory across Kerala. Filter by city, size, illumination, and availability.",
  alternates: { canonical: "/market" },
  openGraph: {
    title: "HOARDINGS360 Marketplace",
    description: "Discover available outdoor advertising faces from verified media owners.",
    url: "/market",
    type: "website",
  },
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { listings, total, page, pageSize } = await searchMarketplaceListings(params);
  const boards = groupListingsByBoard(listings);
  const mapBoards = boards
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      boardId: b.boardId,
      boardName: b.boardName,
      city: b.city,
      locality: b.locality,
      structureType: b.structureType,
      lat: Number(b.latitude),
      lng: Number(b.longitude),
      faceSummaries: b.faces.map((f) => ({ faceLabel: f.face_label, cardRate: f.card_rate })),
    }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr]">
      <MarketSearch values={params} />
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {total} published face{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
        </div>
        <MarketplaceMap boards={mapBoards} />
        <ul className="space-y-3">
          {listings.map((row) => (
            <li key={row.face_id} className="h360-listing">
              <Link href={`/market/${row.board_id}`} className="block">
                <div className="text-xs text-muted-foreground">{row.board_code}</div>
                <div className="text-base font-medium">{row.board_name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {[row.locality, row.city].filter(Boolean).join(", ")} ·{" "}
                  {STRUCTURE_TYPE_LABELS[row.structure_type as StructureType]}
                </div>
                <div className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
                  <div className="font-medium">{row.face_label}</div>
                  <div>
                    {row.width} × {row.height} {row.unit}
                    {row.direction ? ` · ${row.direction}` : ""} ·{" "}
                    {ILLUMINATION_LABELS[row.illumination as IlluminationType]}
                  </div>
                  <div className="mt-1 font-medium">{formatCardRate(row.card_rate)}</div>
                  <div className="text-muted-foreground">
                    {availabilityLabel(row.occupancy_dimension, row.available_from)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {!listings.length ? (
            <li className="rounded-xl border border-dashed bg-white p-8 text-sm text-muted-foreground">
              No marketplace inventory matches those filters.
            </li>
          ) : null}
        </ul>
        {totalPages > 1 ? (
          <nav className="flex gap-2 text-sm" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={`/market?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>).toString()}`}
                className="rounded-lg border px-3 py-1.5"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/market?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>).toString()}`}
                className="rounded-lg border px-3 py-1.5"
              >
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
