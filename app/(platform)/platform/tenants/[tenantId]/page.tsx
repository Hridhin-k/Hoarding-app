import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InspectTenantForm } from "@/components/platform/inspect-form";
import { TenantStatusForm } from "@/components/platform/tenant-status-form";
import { PLATFORM_INSPECT_COOKIE } from "@/lib/constants";
import { requirePlatformStaff } from "@/lib/auth/session";
import { loadPlatformTenantDetail, loadPlatformTenants } from "@/lib/platform/queries";

export default async function PlatformTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const staff = await requirePlatformStaff();
  const { tenantId } = await params;
  const tenants = await loadPlatformTenants();
  const tenant = tenants.find((row) => row.id === tenantId);
  if (!tenant) notFound();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(PLATFORM_INSPECT_COOKIE)?.value;
  let detail = null;
  let inspectError: string | null = null;
  if (sessionId) {
    try {
      const loaded = await loadPlatformTenantDetail(sessionId);
      if (loaded.organization.id === tenantId) detail = loaded;
      else inspectError = "This inspect session is for a different tenant. Start a new inspect.";
    } catch (error) {
      inspectError = error instanceof Error ? error.message : "Inspect session expired.";
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={tenant.name}
        description={`${tenant.slug}${tenant.city ? ` · ${tenant.city}` : ""}`}
        actions={<Badge variant={tenant.status === "active" ? "secondary" : "destructive"}>{tenant.status}</Badge>}
      />

      {staff.role === "SUPER_ADMIN" ? <TenantStatusForm tenantId={tenant.id} status={tenant.status} /> : null}

      {!detail ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Inspect tenant</h2>
          {inspectError ? <p className="text-sm text-destructive">{inspectError}</p> : null}
          <InspectTenantForm tenantId={tenant.id} tenantName={tenant.name} />
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            Inspect reason: {detail.session.reason}. Expires{" "}
            {new Date(detail.session.expires_at).toLocaleString("en-IN")}.
          </p>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Members</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell>{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Boards</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Lifecycle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.boards.map((board) => (
                  <TableRow key={board.id}>
                    <TableCell>{board.board_code}</TableCell>
                    <TableCell>{board.name}</TableCell>
                    <TableCell>{board.city}</TableCell>
                    <TableCell>{board.lifecycle_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Recent enquiries</h2>
            {!detail.recent_enquiries.length ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.recent_enquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell>{enquiry.name}</TableCell>
                      <TableCell>{enquiry.source}</TableCell>
                      <TableCell>{enquiry.status}</TableCell>
                      <TableCell>{new Date(enquiry.created_at).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
