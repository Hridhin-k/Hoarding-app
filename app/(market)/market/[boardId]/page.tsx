import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { EnquiryForm } from "@/components/market/enquiry-form";
import { ListingGallery } from "@/components/market/listing-gallery";
import { MarketEnquireBar } from "@/components/market/enquire-bar";
import { OccupancyBadge } from "@/components/status/status-badge";
import {
  availabilityLabel,
  formatCardRate,
  formatFaceSize,
  getMarketplaceBoard,
  getMarketplaceBoardPhotos,
  startingRate,
} from "@/lib/marketplace";
import { getSiteUrl } from "@/lib/env";
import {
  ILLUMINATION_LABELS,
  STRUCTURE_TYPE_LABELS,
  type IlluminationType,
  type StructureType,
} from "@/lib/types/enums";

type Props = { params: Promise<{ boardId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardId } = await params;
  const faces = await getMarketplaceBoard(boardId);
  if (!faces?.length) {
    return { title: "Board not found", robots: { index: false, follow: false } };
  }
  const board = faces[0];
  const title = `${board.board_name} · ${board.city}`;
  const description = `Outdoor advertising inventory at ${[board.locality, board.city, board.state]
    .filter(Boolean)
    .join(", ")}. ${faces.length} face${faces.length === 1 ? "" : "s"} available for enquiry.`;
  const url = `${getSiteUrl()}/market/${board.board_id}`;
  return {
    title,
    description,
    alternates: { canonical: `/market/${board.board_id}` },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function MarketBoardPage({ params }: Props) {
  const { boardId } = await params;
  const [faces, photos] = await Promise.all([
    getMarketplaceBoard(boardId),
    getMarketplaceBoardPhotos(boardId),
  ]);
  if (!faces?.length) notFound();
  const board = faces[0];
  const locationLine = [
    ...new Set(
      [board.landmark, board.locality, board.city, board.district, board.state, board.pincode].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ].join(", ");
  const fromRate = startingRate(faces.map((face) => face.card_rate));
  const visiblePhotos = photos.filter((photo) => photo.url).map((photo) => ({
    id: photo.id,
    url: photo.url!,
    caption: photo.caption,
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 lg:pb-8">
      <div>
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/market" className="hover:text-foreground">
            Marketplace
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{board.city}</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {STRUCTURE_TYPE_LABELS[board.structure_type as StructureType]} · {board.board_code}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{board.board_name}</h1>
            <p className="mt-1 text-muted-foreground">{locationLine}</p>
          </div>
          <div className="hidden text-right lg:block">
            <p className="text-xs text-muted-foreground">{faces.length > 1 ? "From" : "Card rate"}</p>
            <p className="tabular-inr text-xl font-semibold">{formatCardRate(fromRate)}</p>
            <a href="#faces" className="mt-1 inline-block text-sm font-medium text-primary hover:underline">
              Enquire about a face
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <ListingGallery
          photos={visiblePhotos}
          boardName={board.board_name}
          className="min-h-[18rem] lg:min-h-[36rem]"
        />
        {board.latitude != null && board.longitude != null ? (
          <section className="relative min-h-[50dvh] lg:min-h-[36rem]" aria-label="Location">
            <MapViewLazy
              markers={[
                {
                  id: board.board_id,
                  lat: Number(board.latitude),
                  lng: Number(board.longitude),
                  title: board.board_name,
                },
              ]}
              center={{ lat: Number(board.latitude), lng: Number(board.longitude) }}
              zoom={16}
              className="h-full min-h-[50dvh] lg:min-h-[36rem]"
            />
            <p className="pointer-events-none absolute inset-x-3 bottom-14 z-20 max-w-lg rounded-md border bg-card/95 px-3 py-2 text-xs text-muted-foreground">
              {locationLine}
            </p>
          </section>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-md border bg-card p-5">
            <h2 className="text-base font-semibold">Site</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Structure</dt>
                <dd className="font-medium">{STRUCTURE_TYPE_LABELS[board.structure_type as StructureType]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Faces on this listing</dt>
                <dd className="font-medium">{faces.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Locality</dt>
                <dd className="font-medium">{board.locality || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Landmark</dt>
                <dd className="font-medium">{board.landmark || "—"}</dd>
              </div>
            </dl>
          </section>

          <section id="faces" className="space-y-4 scroll-mt-20">
            <div>
              <h2 className="text-base font-semibold">Faces for enquiry</h2>
              <p className="text-sm text-muted-foreground">
                Each face is sold independently. Occupancy here is live published availability, not a combined board
                status.
              </p>
            </div>
            {faces.map((face) => (
              <article key={face.face_id} id={`face-${face.face_id}`} className="scroll-mt-20 rounded-md border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{face.face_label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatFaceSize(face.width, face.height, face.unit, face.area_sqft)}
                      {face.direction ? ` · ${face.direction}` : ""} ·{" "}
                      {ILLUMINATION_LABELS[face.illumination as IlluminationType]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-inr text-base font-semibold">{formatCardRate(face.card_rate)}</p>
                    <div className="mt-1 flex justify-end">
                      <OccupancyBadge value={face.occupancy_dimension} />
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {availabilityLabel(face.occupancy_dimension, face.available_from)}
                </p>
                {face.visibility_notes ? (
                  <p className="mt-2 text-sm">{face.visibility_notes}</p>
                ) : null}
                <EnquiryForm faceId={face.face_id} faceLabel={face.face_label} />
              </article>
            ))}
          </section>
        </div>

        <aside className="hidden lg:sticky lg:top-16 lg:block">
          <div className="rounded-md border bg-card p-4">
            <p className="text-xs text-muted-foreground">{faces.length > 1 ? "From" : "Card rate"}</p>
            <p className="tabular-inr text-xl font-semibold">{formatCardRate(fromRate)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {faces.length} face{faces.length === 1 ? "" : "s"} · {board.city}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {faces.map((face) => (
                <li key={face.face_id}>
                  <a href={`#face-${face.face_id}`} className="flex items-center justify-between gap-2 hover:text-primary">
                    <span>{face.face_label}</span>
                    <span className="tabular-inr text-muted-foreground">{formatCardRate(face.card_rate)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#faces"
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Enquire
            </a>
          </div>
        </aside>
      </div>
      <MarketEnquireBar price={formatCardRate(fromRate)} href="#faces" />
    </main>
  );
}
