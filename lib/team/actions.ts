"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { APP_ROLES } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import { inviteSchema } from "@/lib/validation/auth";

export async function inviteMemberAction(formData: FormData) {
  const ctx = await requirePermission("team.manage");
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid invite." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      tenant_id: ctx.tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "TEAM_INVITED",
    entityType: "invite",
    entityId: data.id,
    newData: { email: parsed.data.email, role: parsed.data.role },
  });
  revalidatePath("/manage/team");
  return { ok: true };
}

export async function updateMemberRoleAction(memberId: string, role: string) {
  const ctx = await requirePermission("team.manage");
  if (role === "OWNER") return { error: "Use ownership transfer to assign Owner." };
  if (!(APP_ROLES as readonly string[]).includes(role) || role === "OWNER") {
    return { error: "Invalid role." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", ctx.tenantId)
    .neq("user_id", ctx.userId);
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "TEAM_ROLE_UPDATED",
    entityType: "membership",
    entityId: memberId,
    newData: { role },
  });
  revalidatePath("/manage/team");
  return { ok: true };
}

export async function updateSettingsAction(formData: FormData) {
  const ctx = await requirePermission("settings.manage");
  const days = Number(formData.get("vacancyPrelistingDays") || 30);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { error: "Pre-listing window must be between 1 and 365 days." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_settings")
    .update({ vacancy_prelisting_days: days })
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "SETTINGS_UPDATED",
    entityType: "organization_settings",
    entityId: ctx.tenantId,
    newData: { vacancy_prelisting_days: days },
  });
  revalidatePath("/manage/settings");
  return { ok: true };
}

export async function markNotificationReadAction(id: string) {
  const ctx = await requireTenant();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", ctx.userId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/manage");
  return { ok: true };
}
