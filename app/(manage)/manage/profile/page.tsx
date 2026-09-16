import { ProfileForm } from "@/components/auth/profile-form";
import { PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const ctx = await requireTenant();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", ctx.userId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your name is visible to teammates in this organization. It is not a security control."
      />
      <p className="text-sm text-muted-foreground">{ctx.email}</p>
      <ProfileForm fullName={profile?.full_name || ctx.fullName} phone={profile?.phone ?? ""} />
    </div>
  );
}
