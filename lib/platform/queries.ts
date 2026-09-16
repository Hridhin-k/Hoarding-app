import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toErrorMessage } from "@/lib/errors";

export type PlatformOverview = {
  tenant_count: number;
  active_tenant_count: number;
  suspended_tenant_count: number;
  board_count: number;
  face_count: number;
  published_listing_count: number;
  enquiry_count_7d: number;
  open_field_job_count: number;
};

export type PlatformTenantRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  status: "active" | "suspended" | "pending";
  created_at: string;
  member_count: number;
  board_count: number;
  published_face_count: number;
};

export type PlatformTenantDetail = {
  organization: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    status: "active" | "suspended" | "pending";
    created_at: string;
  };
  session: { id: string; reason: string; expires_at: string };
  members: Array<{
    user_id: string;
    role: string;
    status: string;
    full_name: string;
    email: string | null;
  }>;
  boards: Array<{
    id: string;
    board_code: string;
    name: string;
    city: string | null;
    lifecycle_status: string;
  }>;
  recent_enquiries: Array<{
    id: string;
    name: string;
    status: string;
    source: string;
    created_at: string;
  }>;
};

export type PlatformAuditRow = {
  id: string;
  action: string;
  tenant_id: string | null;
  reason: string | null;
  created_at: string;
  actor_id: string;
};

function asNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_overview");
  if (error) throw new Error(toErrorMessage(error));
  const row = Array.isArray(data) ? data[0] : data;
  return {
    tenant_count: asNumber(row?.tenant_count),
    active_tenant_count: asNumber(row?.active_tenant_count),
    suspended_tenant_count: asNumber(row?.suspended_tenant_count),
    board_count: asNumber(row?.board_count),
    face_count: asNumber(row?.face_count),
    published_listing_count: asNumber(row?.published_listing_count),
    enquiry_count_7d: asNumber(row?.enquiry_count_7d),
    open_field_job_count: asNumber(row?.open_field_job_count),
  };
}

export async function loadPlatformTenants(): Promise<PlatformTenantRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_list_tenants");
  if (error) throw new Error(toErrorMessage(error));
  return (data ?? []).map((row: PlatformTenantRow) => ({
    ...row,
    member_count: asNumber(row.member_count),
    board_count: asNumber(row.board_count),
    published_face_count: asNumber(row.published_face_count),
  }));
}

export async function loadPlatformTenantDetail(sessionId: string): Promise<PlatformTenantDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_tenant_detail", { p_session: sessionId });
  if (error) throw new Error(toErrorMessage(error));
  return data as PlatformTenantDetail;
}

export async function loadPlatformAudit(): Promise<PlatformAuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_audit_logs")
    .select("id, action, tenant_id, reason, created_at, actor_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(toErrorMessage(error));
  return (data ?? []) as PlatformAuditRow[];
}
