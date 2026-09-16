import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { can } from "@/lib/permissions/catalog";

export default async function CampaignsPage() {
  const ctx = await requirePermission("campaigns.view");
  const supabase = await createClient();
  const [{ data: campaigns }, { data: customers }, { data: faces }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*, customers(name), campaign_faces(face_id, board_faces(face_label, boards(board_code, name)))")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("customers").select("id, name").eq("tenant_id", ctx.tenantId).order("name").limit(100),
    supabase
      .from("board_faces")
      .select("id, face_label, boards(board_code, name)")
      .eq("tenant_id", ctx.tenantId)
      .is("archived_at", null)
      .order("face_label")
      .limit(200),
  ]);

  const faceOptions =
    faces?.map((f) => {
      const board = Array.isArray(f.boards) ? f.boards[0] : f.boards;
      return { id: f.id, label: `${board?.board_code ?? ""} · ${f.face_label}` };
    }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Lightweight campaigns linked to customers and faces. No payments or contracts in MVP."
      />
      {can(ctx, "campaigns.manage") ? (
        <CreateCampaignForm customers={customers ?? []} faces={faceOptions} />
      ) : null}
      {!campaigns?.length ? (
        <EmptyState title="No campaigns" description="Create a campaign after an enquiry is won." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {campaigns.map((row) => {
            const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
            const linked = (row.campaign_faces ?? [])
              .map((cf: { board_faces?: unknown }) => {
                const face = Array.isArray(cf.board_faces) ? cf.board_faces[0] : cf.board_faces;
                if (!face || typeof face !== "object") return null;
                const typed = face as { face_label?: string; boards?: unknown };
                const board = Array.isArray(typed.boards) ? typed.boards[0] : typed.boards;
                const boardTyped = board as { board_code?: string } | null;
                return `${boardTyped?.board_code ?? ""} ${typed.face_label ?? ""}`.trim();
              })
              .filter(Boolean);
            return (
              <li key={row.id} className="px-4 py-3 text-sm">
                <div className="font-medium">{row.name}</div>
                <div className="text-muted-foreground">
                  {customer?.name || "No customer"} · {row.status} · {row.start_date || "—"} → {row.end_date || "—"}
                </div>
                {linked.length ? (
                  <div className="mt-1 text-xs text-muted-foreground">Faces: {linked.join(", ")}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
