import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getPlatformStaff, getTenantContext, requireUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  await requireUser();
  const staff = await getPlatformStaff();
  if (staff) redirect("/platform");
  const ctx = await getTenantContext();
  if (ctx) redirect("/manage");
  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground">
            <span className="text-primary">HOARDINGS</span>360
          </div>
          <h1 className="mt-2 text-xl font-semibold">Create your organization</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This becomes your tenant. Boards, contracts, and field jobs stay inside it.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
