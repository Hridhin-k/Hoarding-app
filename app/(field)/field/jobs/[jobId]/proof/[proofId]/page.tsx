import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { signedUrl } from "@/lib/storage/signed-url";
import { streetViewOpenUrl } from "@/lib/maps/street-view";
import { formatFaceIdentity } from "@/lib/boards/format";

export default async function ProofDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; proofId: string }>;
}) {
  const ctx = await requireTenant();
  const { jobId, proofId } = await params;
  const supabase = await createClient();

  const { data: proof } = await supabase
    .from("proof_records")
    .select(
      "id, field_job_id, photo_storage_path, captured_at, latitude, longitude, accuracy_meters, notes, captured_by, boards(name, board_code, locality, city), board_faces(face_label), profiles(full_name)",
    )
    .eq("id", proofId)
    .eq("field_job_id", jobId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();

  if (!proof) notFound();
  if (proof.captured_by !== ctx.userId && !can(ctx, "field.manage")) notFound();

  const board = Array.isArray(proof.boards) ? proof.boards[0] : proof.boards;
  const face = Array.isArray(proof.board_faces) ? proof.board_faces[0] : proof.board_faces;
  const tech = Array.isArray(proof.profiles) ? proof.profiles[0] : proof.profiles;
  const url = await signedUrl("proof-of-display", proof.photo_storage_path);

  return (
    <div className="space-y-4">
      <Link href={`/field/jobs/${jobId}`} className="text-sm text-neutral-600">
        ← Back to job
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Proof detail</h1>
        <p className="text-sm text-neutral-600">
          {formatFaceIdentity({
            boardName: board?.name,
            boardCode: board?.board_code,
            faceLabel: face?.face_label,
          })}
        </p>
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Proof of display" className="w-full rounded-2xl object-cover shadow-sm" />
      ) : (
        <div className="rounded-2xl bg-white p-6 text-sm text-neutral-600">Photo unavailable.</div>
      )}
      <dl className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <div>
          <dt className="text-neutral-500">Captured at</dt>
          <dd className="font-medium">{new Date(proof.captured_at).toLocaleString("en-IN")}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Technician</dt>
          <dd className="font-medium">{tech?.full_name || "Assigned technician"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">GPS</dt>
          <dd className="font-medium">
            {proof.latitude.toFixed(6)}, {proof.longitude.toFixed(6)}
            {proof.accuracy_meters != null ? ` ±${Math.round(proof.accuracy_meters)} m` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Location</dt>
          <dd className="font-medium">{[board?.locality, board?.city].filter(Boolean).join(", ") || "—"}</dd>
        </div>
        {proof.notes ? (
          <div>
            <dt className="text-neutral-500">Notes</dt>
            <dd>{proof.notes}</dd>
          </div>
        ) : null}
      </dl>
      <a
        className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium shadow-sm"
        href={`https://maps.google.com/?q=${proof.latitude},${proof.longitude}`}
        target="_blank"
        rel="noreferrer"
      >
        Open capture location
      </a>
      <a
        className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium shadow-sm"
        href={streetViewOpenUrl(Number(proof.latitude), Number(proof.longitude))}
        target="_blank"
        rel="noreferrer"
      >
        Street view
      </a>
      <MapViewLazy
        markers={[
          {
            id: proof.id,
            lat: Number(proof.latitude),
            lng: Number(proof.longitude),
            title: board?.name ?? "Proof location",
          },
        ]}
        center={{ lat: Number(proof.latitude), lng: Number(proof.longitude) }}
        zoom={17}
        className="h-[240px] w-full overflow-hidden rounded-2xl border"
      />
    </div>
  );
}
