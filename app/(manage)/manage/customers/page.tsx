import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateCustomerForm } from "@/components/customers/create-customer-form";
import { can } from "@/lib/permissions/catalog";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  advertiser: "Advertiser",
  agency: "Agency",
  other: "Other",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const ctx = await requirePermission("customers.view");
  const { q, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, company_name, email, phone, type, notes, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("name")
    .limit(100);

  if (type) query = query.eq("type", type);
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},company_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data } = await query;

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Advertisers, agencies, and other accounts for occupancy and campaigns." />
      {can(ctx, "customers.manage") ? <CreateCustomerForm /> : null}
      <form className="flex flex-wrap gap-2" method="get">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search customers" className="max-w-sm" />
        <select name="type" defaultValue={type ?? ""} className="h-8 rounded-lg border px-2 text-sm">
          <option value="">All types</option>
          <option value="advertiser">Advertiser</option>
          <option value="agency">Agency</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className={cn("rounded-lg border px-3 text-sm font-medium hover:bg-muted")}>
          Filter
        </button>
      </form>
      {!data?.length ? (
        <EmptyState title="No customers yet" description="Convert a won enquiry or add an advertiser directly." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {data.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{row.name}</div>
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[row.type] ?? row.type}</span>
              </div>
              <div className="text-muted-foreground">
                {row.company_name || "—"} · {row.email || row.phone || "No contact"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
