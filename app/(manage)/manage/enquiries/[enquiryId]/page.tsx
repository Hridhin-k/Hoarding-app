import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PropertyList } from "@/components/property-list";
import { EnquiryActions } from "@/components/enquiries/enquiry-actions";
import { BookEnquiryDates } from "@/components/enquiries/book-enquiry-dates";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/catalog";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/lib/types/enums";
import { formatFaceIdentity } from "@/lib/boards/format";
import { formatAvailableFrom } from "@/lib/marketplace/public";

function displayDate(value: string | null) {
  if (!value) return "—";
  return formatAvailableFrom(value);
}

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
  const faceLabel = formatFaceIdentity({
    boardName: board?.name,
    boardCode: board?.board_code,
    faceLabel: face?.face_label,
  });

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
        description={`${faceLabel} · ${ENQUIRY_STATUS_LABELS[data.status as EnquiryStatus]}`}
      />
      <div className="h360-panel p-4">
        <PropertyList
          items={[
            { label: "Company", value: data.company_name },
            { label: "Email", value: data.email },
            { label: "Phone", value: data.phone },
            { label: "Source", value: data.source },
            {
              label: "Requested dates",
              value:
                data.requested_start_date || data.requested_end_date
                  ? `${displayDate(data.requested_start_date)} → ${displayDate(data.requested_end_date)}`
                  : null,
            },
            { label: "Customer", value: customer?.name || "Not linked" },
            { label: "Message", value: data.message },
          ]}
        />
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
      {data.face_id && can(ctx, "occupancy.manage") ? (
        <BookEnquiryDates
          enquiryId={data.id}
          faceId={data.face_id}
          faceLabel={faceLabel}
          startDate={data.requested_start_date}
          endDate={data.requested_end_date}
          customerId={data.customer_id}
          notes={data.message}
        />
      ) : null}
    </div>
  );
}
