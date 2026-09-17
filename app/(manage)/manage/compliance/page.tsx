import { differenceInCalendarDays, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CreateComplianceForm } from "@/components/compliance/create-compliance-form";
import { ComplianceSummaryCards } from "@/components/compliance/compliance-summary-cards";
import { DocumentDownloadLink } from "@/components/compliance/document-download-link";
import { RenewComplianceDialog } from "@/components/compliance/renew-compliance-dialog";
import { ComplianceBadge } from "@/components/status/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can } from "@/lib/permissions/catalog";
import { requirePermission } from "@/lib/auth/session";
import { complianceAlertWindow } from "@/lib/compliance/status";
import { createClient } from "@/lib/supabase/server";
import { CLEARANCE_TYPE_LABELS, type ClearanceType, type ComplianceStatus } from "@/lib/types/enums";

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requirePermission("compliance.view");
  const { status } = await searchParams;
  const supabase = await createClient();
  const canManage = can(ctx, "compliance.manage");

  const { data: allMandatory } = await supabase
    .from("compliance_records")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_mandatory", true);

  const counts: Record<ComplianceStatus, number> = {
    valid: 0,
    expiring: 0,
    expired: 0,
    missing: 0,
  };
  for (const row of allMandatory ?? []) {
    const s = row.status as ComplianceStatus;
    if (s in counts) counts[s] += 1;
  }

  let query = supabase
    .from("compliance_records")
    .select("*, boards(name, board_code), documents(id, file_name)")
    .eq("tenant_id", ctx.tenantId)
    .order("expiry_date");
  if (status) query = query.eq("status", status);
  const { data } = await query;

  const { data: boards } = await supabase
    .from("boards")
    .select("id, board_code, name")
    .eq("tenant_id", ctx.tenantId)
    .neq("lifecycle_status", "retired")
    .order("board_code");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="Track permits and clearances per board. Mandatory expired items block marketplace publication."
      />
      <ComplianceSummaryCards counts={counts} activeStatus={status} />
      <div className="flex flex-wrap gap-2">
        <a href="/manage/compliance" className={`h360-chip${!status ? " h360-chip-active" : ""}`}>
          All records
        </a>
        {(["valid", "expiring", "expired", "missing"] as const).map((value) => (
          <a
            key={value}
            href={`/manage/compliance?status=${value}`}
            className={`h360-chip${status === value ? " h360-chip-active" : ""}`}
          >
            {value === "expiring" ? "Expiring soon" : value.charAt(0).toUpperCase() + value.slice(1)}
          </a>
        ))}
      </div>
      {canManage && boards?.length ? <CreateComplianceForm boards={boards} /> : null}
      {!data?.length ? (
        <EmptyState title="No compliance records" description="Add permits and clearances to track expiry." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Board</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              {canManage ? <TableHead className="w-[1%] text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const board = Array.isArray(row.boards) ? row.boards[0] : row.boards;
              const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;
              const days = row.expiry_date ? differenceInCalendarDays(parseISO(row.expiry_date), new Date()) : null;
              const alert = complianceAlertWindow(row.expiry_date);
              const clearanceLabel =
                CLEARANCE_TYPE_LABELS[row.clearance_type as ClearanceType] ?? row.clearance_type;
              const boardLabel = [board?.board_code, board?.name].filter(Boolean).join(" · ") || "Board";
              return (
                <TableRow key={row.id}>
                  <TableCell>{boardLabel}</TableCell>
                  <TableCell>
                    {clearanceLabel}
                    {row.is_mandatory ? (
                      <span className="ml-1 text-xs text-muted-foreground">(mandatory)</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.authority || "—"}</TableCell>
                  <TableCell>{row.expiry_date || "—"}</TableCell>
                  <TableCell>
                    {days == null
                      ? "No expiry"
                      : days < 0
                        ? "Expired"
                        : alert && alert !== "expired"
                          ? `${alert}-day alert`
                          : `In ${days} days`}
                  </TableCell>
                  <TableCell>
                    {doc?.id ? (
                      <DocumentDownloadLink documentId={doc.id} fileName={doc.file_name} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <ComplianceBadge value={row.status as ComplianceStatus} />
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <RenewComplianceDialog
                        record={{
                          id: row.id,
                          boardLabel,
                          clearanceType: row.clearance_type as ClearanceType,
                          authority: row.authority,
                          referenceNumber: row.reference_number,
                          issueDate: row.issue_date,
                          expiryDate: row.expiry_date,
                          renewalCycle: row.renewal_cycle,
                          isMandatory: row.is_mandatory,
                          notes: row.notes,
                          status: row.status,
                        }}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
