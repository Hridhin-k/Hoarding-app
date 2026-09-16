import { endOfDay, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatFaceIdentity } from "@/lib/boards/format";
import { vacancyMessage } from "@/lib/occupancy/status";

export type DashboardStats = {
  boards: number;
  faces: number;
  occupied: number;
  vacant: number;
  becoming_vacant: number;
  permits_expiring: number;
  permits_expired: number;
  marketplace_enquiries: number;
  enquiries_open: number;
  campaigns_active: number;
  jobs_pending: number;
};

export async function loadDashboardStats(tenantId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dashboard_stats", { p_tenant: tenantId });
  const metric = (data ?? {}) as Partial<DashboardStats>;
  return {
    boards: metric.boards ?? 0,
    faces: metric.faces ?? 0,
    occupied: metric.occupied ?? 0,
    vacant: metric.vacant ?? 0,
    becoming_vacant: metric.becoming_vacant ?? 0,
    permits_expiring: metric.permits_expiring ?? 0,
    permits_expired: metric.permits_expired ?? 0,
    marketplace_enquiries: metric.marketplace_enquiries ?? 0,
    enquiries_open: metric.enquiries_open ?? 0,
    campaigns_active: metric.campaigns_active ?? 0,
    jobs_pending: metric.jobs_pending ?? 0,
  };
}

export type UpcomingVacancyRow = {
  id: string;
  faceLabel: string;
  boardName: string;
  boardCode: string;
  endDate: string;
  availableFrom: string;
  message: string;
};

export async function loadUpcomingVacancies(tenantId: string, limit = 8): Promise<UpcomingVacancyRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dashboard_upcoming_vacancies", {
    p_tenant: tenantId,
    p_limit: limit,
  });
  const rows = (data ?? []) as Array<{
    face_id: string;
    face_label: string;
    board_name: string;
    board_code: string;
    end_date: string;
    available_from: string;
  }>;
  return rows.map((row) => ({
    id: row.face_id,
    faceLabel: row.face_label,
    boardName: row.board_name,
    boardCode: row.board_code,
    endDate: row.end_date,
    availableFrom: row.available_from,
    message: vacancyMessage(
      formatFaceIdentity({ boardName: row.board_name, faceLabel: row.face_label }),
      new Date(row.available_from),
    ),
  }));
}

export async function loadExpiringPermits(tenantId: string, limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("compliance_records")
    .select("id, clearance_type, expiry_date, status, boards(name, board_code)")
    .eq("tenant_id", tenantId)
    .eq("is_mandatory", true)
    .in("status", ["expiring", "expired"])
    .order("expiry_date", { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function loadRecentEnquiries(tenantId: string, limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("id, name, company_name, status, source, created_at, board_faces(face_label, boards(name))")
    .eq("tenant_id", tenantId)
    .in("status", ["new", "contacted", "qualified", "proposal"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function loadTodaysFieldJobs(tenantId: string, limit = 8) {
  const supabase = await createClient();
  const dayStart = startOfDay(new Date()).toISOString();
  const dayEnd = endOfDay(new Date()).toISOString();
  const { data } = await supabase
    .from("field_jobs")
    .select("id, title, status, priority, scheduled_at, job_type, boards(name, board_code)")
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "assigned", "in_progress"])
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (data?.length) return data;

  // Fallback: unscheduled pending jobs so the section is still useful.
  const { data: pending } = await supabase
    .from("field_jobs")
    .select("id, title, status, priority, scheduled_at, job_type, boards(name, board_code)")
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return pending ?? [];
}

export function dashboardMetricCards(stats: DashboardStats) {
  return [
    { label: "Boards", value: stats.boards, href: "/manage/boards" },
    { label: "Faces", value: stats.faces, href: "/manage/boards" },
    { label: "Occupied", value: stats.occupied, href: "/manage/occupancy" },
    { label: "Vacant", value: stats.vacant, href: "/manage/occupancy" },
    { label: "Becoming vacant", value: stats.becoming_vacant, href: "/manage/occupancy" },
    { label: "Expiring", value: stats.permits_expiring, href: "/manage/compliance?status=expiring" },
    { label: "Expired", value: stats.permits_expired, href: "/manage/compliance?status=expired" },
    { label: "Enquiries", value: stats.marketplace_enquiries, href: "/manage/enquiries?source=marketplace" },
    { label: "Field jobs", value: stats.jobs_pending, href: "/manage/field-jobs" },
  ];
}
