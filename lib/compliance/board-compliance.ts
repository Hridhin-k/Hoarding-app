import type { SupabaseClient } from "@supabase/supabase-js";
import { rollupBoardCompliance } from "@/lib/compliance/status";
import type { ComplianceStatus } from "@/lib/types/enums";

export type ComplianceRecordRow = {
  is_mandatory: boolean;
  status: ComplianceStatus;
};

export async function fetchBoardComplianceRecords(
  supabase: SupabaseClient,
  boardId: string,
): Promise<ComplianceRecordRow[]> {
  const { data } = await supabase
    .from("compliance_records")
    .select("is_mandatory, status")
    .eq("board_id", boardId);
  return (data ?? []).map((r) => ({
    is_mandatory: r.is_mandatory,
    status: r.status as ComplianceStatus,
  }));
}

export async function boardComplianceStatus(
  supabase: SupabaseClient,
  boardId: string,
): Promise<ComplianceStatus> {
  const records = await fetchBoardComplianceRecords(supabase, boardId);
  return rollupBoardCompliance(records);
}

export function boardComplianceFromRecords(records: ComplianceRecordRow[]): ComplianceStatus {
  return rollupBoardCompliance(records);
}
