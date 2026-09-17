import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { OccupancyBadge } from "@/components/status/status-badge";
import { requireTenant } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import {
  dashboardMetricCards,
  loadDashboardStats,
  loadExpiringPermits,
  loadRecentEnquiries,
  loadTodaysFieldJobs,
  loadUpcomingVacancies,
} from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus, type OccupancyDimension } from "@/lib/types/enums";
import { formatFaceIdentity } from "@/lib/boards/format";

export default async function DashboardPage() {
  const ctx = await requireTenant();

  const [stats, vacancies, permits, enquiries, jobs] = await Promise.all([
    loadDashboardStats(ctx.tenantId),
    loadUpcomingVacancies(ctx.tenantId),
    loadExpiringPermits(ctx.tenantId),
    loadRecentEnquiries(ctx.tenantId),
    loadTodaysFieldJobs(ctx.tenantId),
  ]);

  const cards = dashboardMetricCards(stats);
  const attention = cards.filter((card) =>
    ["Becoming vacant", "Expiring", "Expired", "Enquiries", "Field jobs"].includes(card.label),
  );
  const inventory = cards.filter((card) => ["Boards", "Faces", "Occupied", "Vacant"].includes(card.label));
  const hasBoards = stats.boards > 0;
  const becomingVacant = stats.becoming_vacant;
  const canCreateBoard = can(ctx, "boards.create");

  const headerActions = !hasBoards && canCreateBoard ? (
    <Link href="/manage/boards/new" className={cn(buttonVariants())}>
      Add board
    </Link>
  ) : becomingVacant > 0 ? (
    <>
      <Link href="/manage/occupancy" className={cn(buttonVariants())}>
        Open availability
      </Link>
      {canCreateBoard ? (
        <Link href="/manage/boards/new" className={cn(buttonVariants({ variant: "outline" }))}>
          Add board
        </Link>
      ) : null}
    </>
  ) : canCreateBoard ? (
    <Link href="/manage/boards/new" className={cn(buttonVariants())}>
      Add board
    </Link>
  ) : null;

  return (
    <div className="h360-stack">
      <PageHeader title="Overview" description={ctx.tenantName} actions={headerActions} />

      {!hasBoards ? (
        <EmptyState
          title="Add your first board"
          description="A board is the physical structure. Each board has one or more sellable faces — occupancy, pricing, and marketplace listing all happen on the face, not the board."
          actionHref={canCreateBoard ? "/manage/boards/new" : undefined}
          actionLabel={canCreateBoard ? "Add board" : undefined}
        />
      ) : (
        <>
          {becomingVacant > 0 ? (
            <Link
              href="/manage/occupancy"
              className="h360-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
            >
              <div>
                <div className="text-sm font-medium">
                  {becomingVacant} face{becomingVacant === 1 ? "" : "s"} becoming vacant
                </div>
                <p className="text-sm text-muted-foreground">
                  Pre-list on the marketplace from Availability before the current occupancy ends.
                </p>
              </div>
              <span className="text-sm font-medium">Open availability</span>
            </Link>
          ) : null}

          <section>
            <SectionHeading title="Inventory" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {inventory.map((card) => (
                <Link key={card.label} href={card.href} className="h360-panel px-4 py-4 hover:bg-muted/40">
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-inr tracking-tight">{card.value}</div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Needs attention" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {attention.map((card) => (
                <Link key={card.label} href={card.href} className="h360-panel px-4 py-4 hover:bg-muted/40">
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-inr tracking-tight">{card.value}</div>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeading title="Upcoming vacancies" href="/manage/occupancy" linkLabel="Availability" />
          <div className="h360-panel px-4 py-3">
            {!vacancies.length ? (
              <EmptyState
                compact
                title="Nothing becoming vacant"
                description="Faces entering the pre-listing window will show here."
              />
            ) : (
              <ul className="divide-y">
                {vacancies.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {formatFaceIdentity({ boardName: row.boardName, faceLabel: row.faceLabel })}
                      </div>
                      <div className="text-sm text-muted-foreground">{row.message}</div>
                    </div>
                    <OccupancyBadge value={"becoming_vacant" as OccupancyDimension} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Expiring permits" href="/manage/compliance" linkLabel="Compliance" />
          <div className="h360-panel px-4 py-3">
            {!permits.length ? (
              <EmptyState
                compact
                title="No expiring permits"
                description="Mandatory clearances that need renewal appear here."
              />
            ) : (
              <ul className="divide-y text-sm">
                {permits.map((row) => {
                  const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
                  return (
                    <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="font-medium">{board?.name}</div>
                      <div className="text-muted-foreground">
                        {row.clearance_type} · {row.status} ·{" "}
                        {row.expiry_date
                          ? new Date(`${row.expiry_date}T00:00:00`).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Recent enquiries" href="/manage/enquiries" />
          <div className="h360-panel px-4 py-3">
            {!enquiries.length ? (
              <EmptyState compact title="No open enquiries" description="Marketplace and direct leads will appear here." />
            ) : (
              <ul className="divide-y text-sm">
                {enquiries.map((row) => {
                  const face = Array.isArray(row.board_faces) ? row.board_faces[0] : row.board_faces;
                  const board = face && !Array.isArray(face.boards) ? face.boards : face?.boards?.[0];
                  return (
                    <li key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.name}</div>
                        <div className="truncate text-muted-foreground">
                          {row.company_name ?? "Independent"} ·{" "}
                          {formatFaceIdentity({ boardName: board?.name, faceLabel: face?.face_label })} ·{" "}
                          {ENQUIRY_STATUS_LABELS[row.status as EnquiryStatus]}
                        </div>
                      </div>
                      <Link href={`/manage/enquiries/${row.id}`} className="h360-quiet-link shrink-0 text-xs">
                        Open
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Today’s field jobs" href="/manage/field-jobs" />
          <div className="h360-panel px-4 py-3">
            {!jobs.length ? (
              <EmptyState compact title="No jobs today" description="Assigned technician work appears here." />
            ) : (
              <ul className="divide-y text-sm">
                {jobs.map((row) => {
                  const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
                  return (
                    <li key={row.id} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.title}</div>
                        <div className="text-muted-foreground">
                          {board?.board_code} · {row.job_type} · {row.status}
                          {row.scheduled_at
                            ? ` · ${new Date(row.scheduled_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : ""}
                        </div>
                      </div>
                      <Link href={`/field/jobs/${row.id}`} className="h360-quiet-link shrink-0 text-xs">
                        Open
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
          </div>
        </>
      )}
    </div>
  );
}
