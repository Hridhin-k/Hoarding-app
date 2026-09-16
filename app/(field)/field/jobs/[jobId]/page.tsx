import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { JobActions } from "@/components/field/job-actions";
import { signedUrl } from "@/lib/storage/signed-url";
import { streetViewOpenUrl } from "@/lib/maps/street-view";
import {
  FIELD_JOB_PRIORITY_LABELS,
  FIELD_JOB_STATUS_LABELS,
  FIELD_JOB_TYPE_LABELS,
  type FieldJobPriority,
  type FieldJobStatus,
  type FieldJobType,
} from "@/lib/types/enums";
import { format } from "date-fns";
import { can } from "@/lib/permissions/catalog";
import { formatFaceIdentity } from "@/lib/boards/format";

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const ctx = await requireTenant();
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("field_jobs")
    .select(
      "*, boards(name, locality, city, latitude, longitude, qr_slug, board_code), board_faces(face_label), proof_records(id, photo_storage_path, captured_at, latitude, longitude, accuracy_meters, captured_by)",
    )
    .eq("id", jobId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!job) notFound();

  if (
    job.assigned_to !== ctx.userId &&
    !can(ctx, "field.manage")
  ) {
    notFound();
  }

  const board = Array.isArray(job.boards) ? job.boards[0] : job.boards;
  const face = Array.isArray(job.board_faces) ? job.board_faces[0] : job.board_faces;
  const proofs = await Promise.all(
    ((job.proof_records ?? []) as Array<{
      id: string;
      photo_storage_path: string;
      captured_at: string;
      latitude: number;
      longitude: number;
      accuracy_meters: number | null;
      captured_by: string;
    }>).map(async (proof) => ({
      ...proof,
      url: await signedUrl("proof-of-display", proof.photo_storage_path),
    })),
  );
  const mapsUrl =
    board?.latitude != null && board?.longitude != null
      ? `https://maps.google.com/?q=${board.latitude},${board.longitude}`
      : null;
  const streetViewUrl =
    board?.latitude != null && board?.longitude != null
      ? streetViewOpenUrl(Number(board.latitude), Number(board.longitude))
      : null;

  return (
    <div className="space-y-4">
      <Link href="/field" className="inline-flex text-sm font-medium text-neutral-600">
        ← All jobs
      </Link>
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {FIELD_JOB_TYPE_LABELS[job.job_type as FieldJobType]}
        </div>
        <h1 className="text-xl font-semibold">{board?.name}</h1>
        <p className="text-sm text-neutral-600">
          {formatFaceIdentity({ boardName: board?.name, faceLabel: face?.face_label })}
          {board?.locality || board?.city
            ? ` · ${[board?.locality, board?.city].filter(Boolean).join(", ")}`
            : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border bg-card px-2 py-1 capitalize">
            {FIELD_JOB_STATUS_LABELS[job.status as FieldJobStatus]}
          </span>
          <span className="rounded-md border bg-card px-2 py-1">
            {FIELD_JOB_PRIORITY_LABELS[job.priority as FieldJobPriority]}
          </span>
          {job.scheduled_at ? (
            <span className="rounded-md border bg-card px-2 py-1">
              {format(new Date(job.scheduled_at), "d MMM, p")}
            </span>
          ) : null}
        </div>
        {job.description ? <p className="mt-3 text-sm text-neutral-700">{job.description}</p> : null}
      </div>

      <JobActions
        jobId={job.id}
        status={job.status as FieldJobStatus}
        jobType={job.job_type as FieldJobType}
        mapsUrl={mapsUrl}
        streetViewUrl={streetViewUrl}
        qrVerified={Boolean(job.qr_verified_at)}
      />

      {board?.latitude != null && board?.longitude != null ? (
        <MapViewLazy
          markers={[
            {
              id: job.id,
              lat: Number(board.latitude),
              lng: Number(board.longitude),
              title: board.name ?? "Board",
            },
          ]}
          center={{ lat: Number(board.latitude), lng: Number(board.longitude) }}
          zoom={16}
          className="h-[240px] w-full overflow-hidden rounded-2xl border"
        />
      ) : null}

      {proofs.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Proof of display</h2>
          {proofs.map((proof) => (
            <Link
              key={proof.id}
              href={`/field/jobs/${job.id}/proof/${proof.id}`}
              className="block rounded-2xl bg-white p-3 text-xs shadow-sm"
            >
              {proof.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proof.url} alt="Proof of display" className="mb-2 h-40 w-full rounded-md object-cover" />
              ) : null}
              <div className="font-medium">{new Date(proof.captured_at).toLocaleString("en-IN")}</div>
              <div className="text-neutral-600">
                GPS {proof.latitude.toFixed(5)}, {proof.longitude.toFixed(5)}
                {proof.accuracy_meters != null ? ` ±${Math.round(proof.accuracy_meters)}m` : ""}
              </div>
              <div className="mt-1 text-neutral-500">Open proof detail →</div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
