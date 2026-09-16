import Link from "next/link";
import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { OccupancyForm } from "@/components/occupancy/occupancy-form";
import { OccupancyPeriodActions } from "@/components/occupancy/occupancy-period-actions";
import { PublishVacancyButton } from "@/components/occupancy/publish-vacancy-button";
import { OccupancyBadge, OccupancyStateBadge } from "@/components/status/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import { availableFromDate, faceOccupancyDimension } from "@/lib/occupancy/status";
import { cn } from "@/lib/utils";
import type { OccupancyState } from "@/lib/types/enums";

const stateColor: Record<OccupancyState, string> = {
  occupied: "bg-indigo-600",
  on_hold: "bg-amber-500",
  blocked: "bg-red-600",
  booked_future: "bg-violet-500",
};

export default async function OccupancyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const ctx = await requirePermission("occupancy.view");
  const { view = "calendar" } = await searchParams;
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("organization_settings")
    .select("vacancy_prelisting_days")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const prelistingDays = settings?.vacancy_prelisting_days ?? 30;

  const { data: faces } = await supabase
    .from("board_faces")
    .select("id, face_label, board_id, marketplace_visible, occupancy_periods(*), boards(name, board_code, lifecycle_status)")
    .eq("tenant_id", ctx.tenantId)
    .is("archived_at", null)
    .order("face_label");

  const { data: timeline } = await supabase
    .from("occupancy_periods")
    .select("*, board_faces(face_label, board_id, boards(name, board_code))")
    .eq("tenant_id", ctx.tenantId)
    .order("start_date", { ascending: false });

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = differenceInCalendarDays(monthEnd, monthStart) + 1;

  const faceOptions =
    faces?.map((f) => {
      const board = Array.isArray(f.boards) ? f.boards[0] : f.boards;
      return { id: f.id, label: `${board?.board_code ?? ""} · ${f.face_label}` };
    }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Occupancy"
        description="Face-level holds, bookings, and occupied periods. Reservations cannot overlap at the database."
      />
      <div className="flex gap-2 text-sm">
        <Link
          href="/manage/occupancy?view=calendar"
          className={cn("rounded-full border px-3 py-1", view === "calendar" && "bg-muted font-medium")}
        >
          Calendar
        </Link>
        <Link
          href="/manage/occupancy?view=timeline"
          className={cn("rounded-full border px-3 py-1", view === "timeline" && "bg-muted font-medium")}
        >
          Timeline
        </Link>
      </div>

      {can(ctx, "occupancy.manage") && faceOptions.length ? <OccupancyForm faces={faceOptions} /> : null}

      {!faces?.length ? (
        <EmptyState
          title="No faces"
          description="Add faces to boards before tracking occupancy."
          actionHref="/manage/boards"
          actionLabel="Open boards"
        />
      ) : view === "timeline" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Face</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(timeline ?? []).map((row) => {
              const face = Array.isArray(row.board_faces) ? row.board_faces[0] : row.board_faces;
              const board = face && (Array.isArray(face.boards) ? face.boards[0] : face.boards);
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {board?.board_code} · {face?.face_label}
                  </TableCell>
                  <TableCell>
                    <OccupancyStateBadge value={row.state as OccupancyState} />
                  </TableCell>
                  <TableCell>
                    {row.start_date} → {row.end_date}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{row.notes || "—"}</TableCell>
                  <TableCell>
                    {can(ctx, "occupancy.manage") ? (
                      <OccupancyPeriodActions
                        faceId={row.face_id}
                        period={{
                          id: row.id,
                          start_date: row.start_date,
                          end_date: row.end_date,
                          state: row.state as OccupancyState,
                          notes: row.notes,
                        }}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {faces.map((face) => {
            const board = Array.isArray(face.boards) ? face.boards[0] : face.boards;
            const periods = face.occupancy_periods ?? [];
            const occupancy = faceOccupancyDimension(periods, new Date(), prelistingDays);
            const available = availableFromDate(periods, new Date());
            const canPublishVacancy =
              (occupancy === "becoming_vacant" || occupancy === "vacant" || occupancy === "booked_future") &&
              !face.marketplace_visible;

            return (
              <div key={face.id} className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {board?.name} · {face.face_label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lifecycle {board?.lifecycle_status} · Available from {format(available, "d MMM yyyy")}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OccupancyBadge value={occupancy} />
                    {can(ctx, "marketplace.publish") && canPublishVacancy ? (
                      <PublishVacancyButton faceId={face.id} availableFrom={format(available, "yyyy-MM-dd")} />
                    ) : null}
                  </div>
                </div>
                <div
                  className="grid h-10 overflow-hidden rounded bg-muted"
                  style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: days }).map((_, index) => {
                    const day = addDays(monthStart, index);
                    const hit = periods.find((p) => {
                      const start = parseISO(p.start_date);
                      const end = parseISO(p.end_date);
                      return day >= start && day <= end;
                    });
                    const color = hit ? stateColor[hit.state as OccupancyState] : "bg-transparent";
                    return (
                      <div
                        key={index}
                        className={cn(color, "min-w-0")}
                        title={hit ? `${hit.state as OccupancyState}` : "vacant"}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{format(monthStart, "MMMM yyyy")}</span>
                  <span>
                    {periods.length} period{periods.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
