import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEvent = {
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string | null;
};

export async function writeAuditLog(supabase: SupabaseClient, event: AuditEvent) {
  await supabase.rpc("write_audit_log", {
    p_tenant_id: event.tenantId,
    p_action: event.action,
    p_entity_type: event.entityType,
    p_entity_id: event.entityId,
    p_old_data: event.oldData ?? null,
    p_new_data: event.newData ?? null,
    p_ip: event.ip ?? null,
  });
}
