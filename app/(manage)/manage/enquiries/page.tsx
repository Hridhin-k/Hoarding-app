import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FilterToolbar } from "@/components/filter-toolbar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/lib/types/enums";
import { formatFaceIdentity } from "@/lib/boards/format";

const STATUSES: Array<EnquiryStatus | ""> = [
  "",
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "closed",
];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; assigned?: string }>;
}) {
  const ctx = await requirePermission("enquiries.view");
  const { q, status, source, assigned } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("enquiries")
    .select(
      "id, name, company_name, email, phone, status, source, created_at, assigned_to, board_faces(face_label, boards(name))",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);
  if (assigned === "unassigned") query = query.is("assigned_to", null);
  if (assigned === "me") query = query.eq("assigned_to", ctx.userId);
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},company_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data } = await query;

  return (
    <div className="h360-stack">
      <PageHeader title="Enquiries" />
      <FilterToolbar>
      <form className="flex flex-wrap items-center gap-2" method="get">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, company, email, phone"
          className="max-w-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="h360-select">
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {ENQUIRY_STATUS_LABELS[value as EnquiryStatus]}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={source ?? ""} className="h360-select">
          <option value="">All sources</option>
          <option value="marketplace">Marketplace</option>
          <option value="direct">Direct</option>
          <option value="referral">Referral</option>
          <option value="other">Other</option>
        </select>
        <select name="assigned" defaultValue={assigned ?? ""} className="h360-select">
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <button type="submit" className="h360-chip">
          Filter
        </button>
      </form>
      </FilterToolbar>
      {!data?.length ? (
        <EmptyState title="No enquiries match" description="Try clearing filters or wait for marketplace demand." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Advertiser</TableHead>
              <TableHead>Face</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const face = Array.isArray(row.board_faces) ? row.board_faces[0] : row.board_faces;
              const board = face && !Array.isArray(face.boards) ? face.boards : face?.boards?.[0];
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/manage/enquiries/${row.id}`} className="font-medium hover:text-primary">
                      {row.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{row.company_name || row.email}</div>
                  </TableCell>
                  <TableCell>
                    {formatFaceIdentity({ boardName: board?.name, faceLabel: face?.face_label })}
                  </TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{ENQUIRY_STATUS_LABELS[row.status as EnquiryStatus]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
