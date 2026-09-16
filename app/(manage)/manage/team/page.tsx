import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, type AppRole } from "@/lib/permissions/catalog";
import { InviteForm } from "@/components/team/invite-form";

export default async function TeamPage() {
  const ctx = await requirePermission("team.manage");
  const supabase = await createClient();
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from("organization_members").select("id, role, status, user_id, profiles(full_name)").eq("organization_id", ctx.tenantId),
    supabase.from("organization_invites").select("*").eq("tenant_id", ctx.tenantId).is("accepted_at", null),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Roles control access. Technicians never see financial admin." />
      <InviteForm />
      <ul className="divide-y rounded-md border bg-card">
        {(members ?? []).map((m) => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return (
            <li key={m.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{profile?.full_name || m.user_id}</span>
              <span className="text-muted-foreground">
                {ROLE_LABELS[m.role as AppRole]} · {m.status}
              </span>
            </li>
          );
        })}
      </ul>
      {!invites?.length ? (
        <EmptyState title="No pending invites" description="Invite sales, compliance, or field technicians by email." />
      ) : (
        <ul className="text-sm text-muted-foreground">
          {invites.map((i) => (
            <li key={i.id}>
              {i.email} · {i.role}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
