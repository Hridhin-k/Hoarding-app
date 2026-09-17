import Link from "next/link";
import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { OccupancyForm } from "@/components/occupancy/occupancy-form";
import { OccupancyPeriodActions } from "@/components/occupancy/occupancy-period-actions";
import { PublishVacancyButton } from "@/components/occupancy/publish-vacancy-button";
import { DisclosurePanel } from "@/components/disclosure-panel";
import { OccupancyBadge, OccupancyStateBadge } from "@/components/status/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import { availableFromDate, faceOccupancyDimension, occupancyStateForRequestedDates } from "@/lib/occupancy/status";
import { cn } from "@/lib/utils";
import type { OccupancyState } from "@/lib/types/enums";
import { formatFaceIdentity } from "@/lib/boards/format";

const stateColor: Record<OccupancyState, string> = {
  occupied: "bg-indigo-600",
  on_hold: "bg-amber-500",
  blocked: "bg-red-600",
  booked_future: "bg-violet-500",
};

export default async function OccupancyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; face?: string; start?: string; end?: string; customer?: string; notes?: string }>;
}) {
  const ctx = await requirePermission("occupancy.view");
  const { view = "calendar", face, start, end, customer, notes } = await searchParams;
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
    faces
      ?.map((f) => {
        const board = Array.isArray(f.boards) ? f.boards[0] : f.boards;
        return {
          id: f.id,
          label: formatFaceIdentity({ boardName: board?.name, boardCode: board?.board_code, faceLabel: f.face_label }),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "en-IN")) ?? [];

  return (
    <div className="h360-stack">
      <PageHeader title="Availability" description="Holds, bookings, and occupied dates for each face." />
      <div className="flex gap-2">
        <Link href="/manage/occupancy?view=calendar" className={cn("h360-chip", view === "calendar" && "h360-chip-active")}>
          Calendar
        </Link>
        <Link href="/manage/occupancy?view=timeline" className={cn("h360-chip", view === "timeline" && "h360-chip-active")}>
          Timeline
        </Link>
      </div>

      {can(ctx, "occupancy.manage") && faceOptions.length ? (
        <DisclosurePanel title="Add occupancy" defaultOpen={Boolean(face || start)}>
          <OccupancyForm
            faces={faceOptions}
            defaults={{
              faceId: face,
              startDate: start,
              endDate: end,
              customerId: customer,
              notes,
              mode: start ? occupancyStateForRequestedDates(start) : undefined,
            }}
          />
        </DisclosurePanel>
      ) : null}

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
              <TableHead>Board / face</TableHead>
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
                    {formatFaceIdentity({
                      boardName: board?.name,
                      boardCode: board?.board_code,
                      faceLabel: face?.face_label,
                    })}
                  </TableCell>
                  <TableCell>
                    <OccupancyStateBadge value={row.state as OccupancyState} />
                  </TableCell>
                  <TableCell>
                    {format(parseISO(row.start_date), "d MMM yyyy")} → {format(parseISO(row.end_date), "d MMM yyyy")}
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
              <div key={face.id} className="h360-panel p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {formatFaceIdentity({
                        boardName: board?.name,
                        boardCode: board?.board_code,
                        faceLabel: face.face_label,
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Available from {format(available, "d MMM yyyy")}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OccupancyBadge value={occupancy} />
                    {can(ctx, "marketplace.publish") && canPublishVacancy ? (
                      <PublishVacancyButton faceId={face.id} availableFrom={format(available, "yyyy-MM-dd")} />
                    ) : null}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[40rem]">
                    <div
                      className="grid h-12 overflow-hidden rounded-md bg-muted"
                      style={{ gridTemplateColumns: `repeat(${days}, minmax(0.75rem, 1fr))` }}
                    >
                      {Array.from({ length: days }).map((_, index) => {
                        const day = addDays(monthStart, index);
                        const hit = periods.find((p) => {
                          const startDate = parseISO(p.start_date);
                          const endDate = parseISO(p.end_date);
                          return day >= startDate && day <= endDate;
                        });
                        const color = hit ? stateColor[hit.state as OccupancyState] : "bg-transparent";
                        return (
                          <div
                            key={index}
                            className={cn(color, "min-w-0")}
                            title={
                              hit
                                ? `${hit.state as OccupancyState} · ${format(day, "d MMM")}`
                                : `vacant · ${format(day, "d MMM")}`
                            }
                          />
                        );
                      })}
                    </div>
                    <div
                      className="mt-1 grid text-[10px] text-muted-foreground"
                      style={{ gridTemplateColumns: `repeat(${days}, minmax(0.75rem, 1fr))` }}
                    >
                      {Array.from({ length: days }).map((_, index) => {
                        const day = addDays(monthStart, index);
                        const show = index === 0 || day.getDate() === 1 || day.getDate() % 5 === 0;
                        return (
                          <span key={index} className={cn("truncate", !show && "invisible")}>
                            {format(day, "d")}
                          </span>
                        );
                      })}
                    </div>
                  </div>
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
