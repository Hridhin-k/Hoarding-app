import { addDays, endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireTenant } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import {
  FIELD_JOB_PRIORITY_LABELS,
  FIELD_JOB_STATUS_LABELS,
  FIELD_JOB_TYPE_LABELS,
  type FieldJobPriority,
  type FieldJobStatus,
  type FieldJobType,
} from "@/lib/types/enums";
import { cn } from "@/lib/utils";
import { formatFaceIdentity } from "@/lib/boards/format";

export default async function FieldHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await requireTenant();
  const { tab = "today" } = await searchParams;
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("field_jobs")
    .select("*, boards(name, locality, city), board_faces(face_label)")
    .eq("tenant_id", ctx.tenantId)
    .eq("assigned_to", ctx.userId)
    .order("scheduled_at", { ascending: true });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const upcomingEnd = endOfDay(addDays(new Date(), 14));

  const all = jobs ?? [];
  const today = all.filter((job) => {
    if (["completed", "cancelled"].includes(job.status)) return false;
    if (!job.scheduled_at) return true;
    const when = new Date(job.scheduled_at);
    return isWithinInterval(when, { start: todayStart, end: todayEnd }) || job.status === "in_progress";
  });
  const upcoming = all.filter((job) => {
    if (["completed", "cancelled"].includes(job.status)) return false;
    if (!job.scheduled_at) return false;
    const when = new Date(job.scheduled_at);
    return when > todayEnd && when <= upcomingEnd;
  });
  const completed = all.filter((job) => job.status === "completed").slice(0, 20);

  const tabs = ["today", "upcoming", "completed"] as const;
  type Tab = (typeof tabs)[number];
  const active: Tab = tabs.includes(tab as Tab) ? (tab as Tab) : "today";
  const sections: Record<Tab, typeof all> = { today, upcoming, completed };
  const list = sections[active];
  const canManageJobs = can(ctx, "field.manage");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today’s assigned site work.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["today", "Today", today.length],
            ["upcoming", "Upcoming", upcoming.length],
            ["completed", "Done", completed.length],
          ] as const
        ).map(([key, label, count]) => (
          <Link
            key={key}
            href={`/field?tab=${key}`}
            className={cn(
              "rounded-md px-2 py-3 text-center text-xs",
              active === key
                ? "bg-muted font-medium text-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border",
            )}
          >
            <div>{label}</div>
            <div className="mt-1 text-lg tabular-nums">{count}</div>
          </Link>
        ))}
      </div>

      {!list.length ? (
        <EmptyState
          title={
            canManageJobs && active === "today"
              ? "No jobs assigned to you"
              : active === "today"
                ? "No jobs today"
                : active === "upcoming"
                  ? "No upcoming jobs"
                  : "No completed jobs yet"
          }
          description={
            canManageJobs
              ? "Field is for technicians with assigned jobs. Create and assign work in Manage, then open it here as that technician."
              : "Assigned field work for you appears here."
          }
          actionHref={canManageJobs ? "/manage/field-jobs" : undefined}
          actionLabel={canManageJobs ? "Open field jobs" : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((job) => {
            const board = Array.isArray(job.boards) ? job.boards[0] : job.boards;
            const face = Array.isArray(job.board_faces) ? job.board_faces[0] : job.board_faces;
            return (
              <li key={job.id}>
                <Link href={`/field/jobs/${job.id}`} className="block h360-panel p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {FIELD_JOB_TYPE_LABELS[job.job_type as FieldJobType]}
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">
                      {FIELD_JOB_PRIORITY_LABELS[job.priority as FieldJobPriority]}
                    </span>
                  </div>
                  <div className="mt-1 text-base font-semibold">{board?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFaceIdentity({ boardName: board?.name, faceLabel: face?.face_label })}
                    {board?.locality || board?.city
                      ? ` · ${[board?.locality, board?.city].filter(Boolean).join(", ")}`
                      : ""}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>
                      {job.scheduled_at ? format(new Date(job.scheduled_at), "d MMM, p") : "Unscheduled"}
                    </span>
                    <span className="font-medium">
                      {FIELD_JOB_STATUS_LABELS[job.status as FieldJobStatus]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
