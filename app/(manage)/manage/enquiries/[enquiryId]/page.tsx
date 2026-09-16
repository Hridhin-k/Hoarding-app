import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EnquiryActions } from "@/components/enquiries/enquiry-actions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/catalog";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/lib/types/enums";

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ enquiryId: string }>;
}) {
  const ctx = await requirePermission("enquiries.view");
  const { enquiryId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*, board_faces(face_label, boards(name, board_code)), customers(id, name)")
    .eq("id", enquiryId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!data) notFound();

  const face = Array.isArray(data.board_faces) ? data.board_faces[0] : data.board_faces;
  const board = face && !Array.isArray(face.boards) ? face.boards : face?.boards?.[0];
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name, email)")
    .eq("organization_id", ctx.tenantId)
    .eq("status", "active");

  const assigneeOptions =
    members?.map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        user_id: m.user_id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`${board?.name ?? ""} · ${face?.face_label ?? ""} · ${ENQUIRY_STATUS_LABELS[data.status as EnquiryStatus]}`}
      />
      <div className="grid gap-2 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
        <div>Company: {data.company_name || "—"}</div>
        <div>Email: {data.email}</div>
        <div>Phone: {data.phone}</div>
        <div>Source: {data.source}</div>
        <div>
          Requested: {data.requested_start_date || "—"} → {data.requested_end_date || "—"}
        </div>
        <div>Customer: {customer?.name || "Not linked"}</div>
        <p className="sm:col-span-2 text-muted-foreground">{data.message || "No message."}</p>
      </div>
      {can(ctx, "enquiries.manage") ? (
        <EnquiryActions
          enquiryId={data.id}
          status={data.status as EnquiryStatus}
          assignedTo={data.assigned_to}
          members={assigneeOptions}
          customerId={data.customer_id}
        />
      ) : null}
    </div>
  );
}
