import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePlatformStaff } from "@/lib/auth/session";
import { loadPlatformTenants } from "@/lib/platform/queries";

export default async function PlatformTenantsPage() {
  await requirePlatformStaff();
  const tenants = await loadPlatformTenants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Media-owner organizations on this platform. Inspect is audited and time-boxed."
      />
      {!tenants.length ? (
        <EmptyState title="No tenants" description="Organizations appear here after owners complete onboarding." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Boards</TableHead>
              <TableHead>Live listings</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-muted-foreground">
                    {tenant.slug}
                    {tenant.city ? ` · ${tenant.city}` : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={tenant.status === "active" ? "secondary" : "destructive"}>{tenant.status}</Badge>
                </TableCell>
                <TableCell>{tenant.member_count}</TableCell>
                <TableCell>{tenant.board_count}</TableCell>
                <TableCell>{tenant.published_face_count}</TableCell>
                <TableCell>
                  <Link href={`/platform/tenants/${tenant.id}`} className="text-sm text-primary underline">
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
