import { ProfileForm } from "@/components/auth/profile-form";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { requireTenant } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function FieldProfilePage() {
  const ctx = await requireTenant();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", ctx.userId)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-neutral-600">{ctx.email}</p>
        <div className="mt-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
          <div className="font-medium">{ctx.tenantName}</div>
          <div className="text-neutral-600">{ROLE_LABELS[ctx.role]}</div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-700">Your details</h2>
        <ProfileForm fullName={profile?.full_name || ctx.fullName} phone={profile?.phone ?? ""} />
      </section>

      <section className="rounded-2xl bg-white p-4 text-sm text-neutral-600 shadow-sm">
        <h2 className="font-medium text-neutral-900">Install Field on your phone</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Open this page in Chrome (Android) or Safari (iPhone).</li>
          <li>Use Add to Home Screen / Install app.</li>
          <li>Launch H360 Field from your home screen for full-screen use.</li>
        </ol>
        <p className="mt-2 text-xs">
          Proofs still queue offline if the network drops. Sign out below when you finish your shift.
        </p>
      </section>

      <form action={signOutAction} className="pb-4">
        <input type="hidden" name="next" value="/field" />
        <Button
          type="submit"
          variant="outline"
          className="h-12 w-full rounded-2xl border-red-200 bg-white text-base text-red-700 hover:bg-red-50"
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}
