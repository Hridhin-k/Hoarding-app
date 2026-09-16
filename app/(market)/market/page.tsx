import type { Metadata } from "next";
import Link from "next/link";
import { MarketSearch } from "@/components/market/search";
import { MarketplaceMap } from "@/components/market/marketplace-map";
import { MarketBrowseLayout } from "@/components/market/browse-layout";
import { MarketListingCard } from "@/components/market/listing-card";
import { EmptyState } from "@/components/empty-state";
import {
  activeMarketplaceFilters,
  getMarketplaceCoverPhotos,
  groupListingsByBoard,
  marketplaceHref,
  marketplaceHrefWithout,
  searchMarketplaceListings,
} from "@/lib/marketplace";

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
  const covers = await getMarketplaceCoverPhotos(boards.map((board) => board.boardId));
  const chips = activeMarketplaceFilters(params);
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

  const list = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {total} published face{total === 1 ? "" : "s"}
            {boards.length ? ` · ${boards.length} site${boards.length === 1 ? "" : "s"} on this page` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}. Photos, rates, and availability are what media owners have published.
          </p>
        </div>
      </div>
      {chips.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Link
                href={marketplaceHrefWithout(params, chip.key)}
                className="h360-chip-active inline-flex h-8 items-center rounded-md px-3 text-sm"
              >
                {chip.label}
                <span className="sr-only"> Remove filter</span>
                <span aria-hidden="true" className="ml-1.5 text-muted-foreground">
                  ×
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/market" className="h360-chip">
              Clear all
            </Link>
          </li>
        </ul>
      ) : null}
      <ul className="space-y-3">
        {boards.map((board) => {
          const cover = covers.get(board.boardId);
          return (
            <li key={board.boardId}>
              <MarketListingCard
                boardId={board.boardId}
                boardName={board.boardName}
                boardCode={board.boardCode}
                city={board.city}
                locality={board.locality}
                landmark={board.faces[0]?.landmark ?? null}
                structureType={board.structureType}
                faces={board.faces}
                photoUrl={cover?.url}
                photoCaption={cover?.caption}
              />
            </li>
          );
        })}
        {!boards.length ? (
          <li>
            <EmptyState
              title="No inventory matches those filters"
              description="Try a different district, clear availability, or search a locality. Only published, eligible faces appear here."
              actionHref="/market"
              actionLabel="Reset filters"
            />
          </li>
        ) : null}
      </ul>
      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link href={marketplaceHref(params, { page: String(page - 1) })} className="h360-chip">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={marketplaceHref(params, { page: String(page + 1) })} className="h360-chip">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <MarketSearch values={params} activeCount={chips.length} />
        <MarketBrowseLayout list={list} map={<MarketplaceMap boards={mapBoards} />} />
      </div>
    </main>
  );
}
