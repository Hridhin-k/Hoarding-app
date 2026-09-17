import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const ctx = await requirePermission("settings.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_settings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <SettingsForm days={data?.vacancy_prelisting_days ?? 30} />
    </div>
  );
}
