import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { EnquiryForm } from "@/components/market/enquiry-form";
import {
  availabilityLabel,
  formatCardRate,
  getMarketplaceBoard,
  getMarketplaceBoardPhotos,
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
  const locationLine = [board.landmark, board.locality, board.city, board.district, board.state, board.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <Link href="/market" className="text-sm text-muted-foreground hover:text-foreground">
          ← Marketplace
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{board.board_name}</h1>
        <p className="text-muted-foreground">{locationLine}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {STRUCTURE_TYPE_LABELS[board.structure_type as StructureType]} · {board.board_code}
        </p>
      </div>

      {photos.some((p) => p.url) ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {photos
            .filter((p) => p.url)
            .map((photo) => (
              <div key={photo.id} className="relative h-56 overflow-hidden rounded-xl border bg-white">
                <Image
                  src={photo.url!}
                  alt={photo.caption || board.board_name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  unoptimized
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-white text-sm text-muted-foreground">
          Photos will appear when the media owner publishes site images.
        </div>
      )}

      {board.latitude != null && board.longitude != null ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Location</h2>
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
            zoom={14}
            className="h-[320px] w-full overflow-hidden rounded-xl border"
          />
          <p className="text-sm text-muted-foreground">{locationLine}</p>
        </section>
      ) : null}

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Board information</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Structure</dt>
            <dd>{STRUCTURE_TYPE_LABELS[board.structure_type as StructureType]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">City</dt>
            <dd>{board.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Locality</dt>
            <dd>{board.locality || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Landmark</dt>
            <dd>{board.landmark || "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Faces</h2>
        {faces.map((face) => (
          <section key={face.face_id} id={`face-${face.face_id}`} className="rounded-xl border bg-white p-5">
            <h3 className="text-base font-medium">{face.face_label}</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd>
                  {face.width} × {face.height} {face.unit}
                  {face.area_sqft ? ` (${Number(face.area_sqft).toFixed(0)} sq ft)` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Direction</dt>
                <dd>{face.direction || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Illumination</dt>
                <dd>{ILLUMINATION_LABELS[face.illumination as IlluminationType]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pricing</dt>
                <dd className="font-medium">{formatCardRate(face.card_rate)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Availability</dt>
                <dd>{availabilityLabel(face.occupancy_dimension, face.available_from)}</dd>
              </div>
              {face.visibility_notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Site notes</dt>
                  <dd>{face.visibility_notes}</dd>
                </div>
              ) : null}
            </dl>
            <EnquiryForm faceId={face.face_id} faceLabel={face.face_label} />
          </section>
        ))}
      </div>
    </main>
  );
}
