import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations"
        description={`${ctx.tenantName} · inventory, vacancy, compliance, and demand.`}
        actions={
          can(ctx, "boards.create") ? (
            <Link href="/manage/boards/new" className={cn(buttonVariants())}>
              Add board
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl border bg-card p-4 hover:bg-muted/40">
            <div className="text-xs text-muted-foreground">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming Vacancies</CardTitle>
            <Link href="/manage/occupancy" className="text-xs text-muted-foreground underline">
              Occupancy
            </Link>
          </CardHeader>
          <CardContent>
            {!vacancies.length ? (
              <EmptyState
                title="No faces becoming vacant"
                description="When occupancy enters the pre-listing window, sales alerts appear here."
              />
            ) : (
              <ul className="space-y-3">
                {vacancies.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {row.boardName} · {row.faceLabel}
                      </div>
                      <div className="text-muted-foreground">{row.message}</div>
                    </div>
                    <OccupancyBadge value={"becoming_vacant" as OccupancyDimension} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Expiring Permits</CardTitle>
            <Link href="/manage/compliance" className="text-xs text-muted-foreground underline">
              Compliance
            </Link>
          </CardHeader>
          <CardContent>
            {!permits.length ? (
              <EmptyState
                title="No permits need action"
                description="Mandatory expiring or expired clearances appear here."
                actionHref="/manage/compliance"
                actionLabel="Open compliance"
              />
            ) : (
              <ul className="space-y-3 text-sm">
                {permits.map((row) => {
                  const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
                  return (
                    <li key={row.id} className="flex justify-between gap-3">
                      <div>
                        <div className="font-medium">{board?.name}</div>
                        <div className="text-muted-foreground">
                          {row.clearance_type} · {row.status} · {row.expiry_date}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Enquiries</CardTitle>
            <Link href="/manage/enquiries" className="text-xs text-muted-foreground underline">
              All enquiries
            </Link>
          </CardHeader>
          <CardContent>
            {!enquiries.length ? (
              <EmptyState
                title="No enquiries yet"
                description="Marketplace and direct enquiries will appear here."
                actionHref="/market"
                actionLabel="View marketplace"
              />
            ) : (
              <ul className="divide-y text-sm">
                {enquiries.map((row) => {
                  const face = Array.isArray(row.board_faces) ? row.board_faces[0] : row.board_faces;
                  const board = face && !Array.isArray(face.boards) ? face.boards : face?.boards?.[0];
                  return (
                    <li key={row.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground">
                          {row.company_name ?? "Independent"} · {board?.name} {face?.face_label} ·{" "}
                          {ENQUIRY_STATUS_LABELS[row.status as EnquiryStatus]}
                        </div>
                      </div>
                      <Link href={`/manage/enquiries/${row.id}`} className="text-xs underline">
                        Open
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s Field Jobs</CardTitle>
            <Link href="/manage/field-jobs" className="text-xs text-muted-foreground underline">
              Field jobs
            </Link>
          </CardHeader>
          <CardContent>
            {!jobs.length ? (
              <EmptyState
                title="No field jobs today"
                description="Scheduled or pending technician jobs appear here."
                actionHref="/manage/field-jobs"
                actionLabel="Open field jobs"
              />
            ) : (
              <ul className="space-y-3 text-sm">
                {jobs.map((row) => {
                  const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
                  return (
                    <li key={row.id} className="flex justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.title}</div>
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
                      <Link href={`/field/jobs/${row.id}`} className="text-xs underline">
                        Open
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
