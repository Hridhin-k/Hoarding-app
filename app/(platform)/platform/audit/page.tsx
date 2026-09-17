import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePlatformStaff } from "@/lib/auth/session";
import { loadPlatformAudit } from "@/lib/platform/queries";

export default async function PlatformAuditPage() {
  await requirePlatformStaff();
  const rows = await loadPlatformAudit();

  return (
    <div className="space-y-6">
      <PageHeader title="Platform audit" />
      {!rows.length ? (
        <EmptyState title="No platform events" description="Inspect and tenant status changes appear here." />
      ) : (
        <ul className="divide-y rounded-md border bg-card text-sm">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="font-medium">{row.action}</div>
              <div className="text-muted-foreground">
                {row.reason || "No reason"} · {new Date(row.created_at).toLocaleString("en-IN")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
