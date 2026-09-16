import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  const ctx = await requirePermission("audit.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Important mutations are recorded with actor and entity." />
      {!data?.length ? (
        <EmptyState title="No audit events" description="Creates, publishes, occupancy changes, and field completion appear here." />
      ) : (
        <ul className="divide-y rounded-md border bg-card text-sm">
          {data.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="font-medium">{row.action}</div>
              <div className="text-muted-foreground">
                {row.entity_type} · {new Date(row.created_at).toLocaleString("en-IN")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
