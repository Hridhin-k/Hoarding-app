import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateJobForm } from "@/components/field/create-job-form";
import { can } from "@/lib/permissions/catalog";
import { FIELD_JOB_TYPE_LABELS, type FieldJobType } from "@/lib/types/enums";

export default async function FieldJobsPage() {
  const ctx = await requirePermission("field.manage");
  const supabase = await createClient();
  const [{ data: jobs }, { data: boards }, { data: members }] = await Promise.all([
    supabase
      .from("field_jobs")
      .select("id, title, status, job_type, created_at, boards(name, board_code)")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("boards")
      .select("id, name, board_code")
      .eq("tenant_id", ctx.tenantId)
      .neq("lifecycle_status", "retired")
      .order("board_code")
      .limit(200),
    supabase
      .from("organization_members")
      .select("user_id, role, profiles(full_name)")
      .eq("organization_id", ctx.tenantId)
      .eq("status", "active"),
  ]);
  const techs = (members ?? [])
    .filter((m) => m.role === "TECHNICIAN" || m.role === "OPS_MANAGER")
    .map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, name: profile?.full_name || "Team member" };
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Field jobs" description="Assign site work. Technicians complete jobs in the Field PWA." />
      {can(ctx, "field.manage") ? <CreateJobForm boards={boards ?? []} techs={techs} /> : null}
      {!jobs?.length ? (
        <EmptyState title="No field jobs" description="Create installation, inspection, or proof-of-display jobs." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {jobs.map((job) => {
            const board = Array.isArray(job.boards) ? job.boards[0] : job.boards;
            return (
              <li key={job.id} className="px-4 py-3 text-sm">
                <div className="font-medium">{job.title}</div>
                <div className="text-muted-foreground">
                  {board?.name} · {FIELD_JOB_TYPE_LABELS[job.job_type as FieldJobType]} · {job.status}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
