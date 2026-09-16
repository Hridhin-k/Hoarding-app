import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireTenant } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const ctx = await requireTenant();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Vacancy, compliance, and enquiry alerts." />
      {!data?.length ? (
        <EmptyState title="No notifications" description="Sales vacancy alerts and permit reminders will show here." />
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {data.map((n) => (
            <li key={n.id} className="px-4 py-3 text-sm">
              <div className="font-medium">{n.title}</div>
              <div className="text-muted-foreground">{n.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
