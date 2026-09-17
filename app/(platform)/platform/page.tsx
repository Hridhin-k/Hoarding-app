import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requirePlatformStaff } from "@/lib/auth/session";
import { loadPlatformOverview } from "@/lib/platform/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PlatformOverviewPage() {
  await requirePlatformStaff();
  const stats = await loadPlatformOverview();

  const cards = [
    { label: "Tenants", value: stats.tenant_count, href: "/platform/tenants" },
    { label: "Active tenants", value: stats.active_tenant_count, href: "/platform/tenants" },
    { label: "Suspended", value: stats.suspended_tenant_count, href: "/platform/tenants" },
    { label: "Boards", value: stats.board_count, href: "/platform/tenants" },
    { label: "Faces", value: stats.face_count, href: "/platform/tenants" },
    { label: "Live listings", value: stats.published_listing_count, href: "/market" },
    { label: "Enquiries (7 days)", value: stats.enquiry_count_7d, href: "/platform/tenants" },
    { label: "Open field jobs", value: stats.open_field_job_count, href: "/platform/tenants" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Tenant health across HOARDINGS360."
        actions={
          <Link href="/platform/tenants" className={cn(buttonVariants())}>
            View tenants
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="h360-panel px-4 py-4 hover:bg-muted/40">
            <div className="text-xs text-muted-foreground">{card.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{card.value}</div>
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Health is counted from Postgres. Job queues, billing, and verified badges are later M33 releases.
        Inspecting a tenant requires a written reason and expires in 30 minutes.
      </p>
    </div>
  );
}
