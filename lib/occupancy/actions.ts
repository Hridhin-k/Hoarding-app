"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { OCCUPANCY_OVERLAP_MESSAGE } from "@/lib/occupancy/constants";
import { occupancyConflictMessage, occupancyConflicts } from "@/lib/occupancy/status";
import { createClient } from "@/lib/supabase/server";
import { occupancySchema, updateOccupancySchema } from "@/lib/validation/schemas";

async function loadFacePeriods(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  faceId: string,
) {
  return supabase
    .from("occupancy_periods")
    .select("id, start_date, end_date, state")
    .eq("face_id", faceId)
    .eq("tenant_id", tenantId);
}

export async function createOccupancyAction(input: unknown) {
  const ctx = await requirePermission("occupancy.manage");
  const parsed = occupancySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid occupancy." };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await loadFacePeriods(
    supabase,
    ctx.tenantId,
    parsed.data.faceId,
  );
  if (existingError) return { error: toErrorMessage(existingError) };

  const conflicts = occupancyConflicts(
    {
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      state: parsed.data.state,
    },
    existing ?? [],
  );
  if (conflicts.length) {
    return { error: occupancyConflictMessage(parsed.data.state, conflicts) };
  }

  const { data, error } = await supabase
    .from("occupancy_periods")
    .insert({
      tenant_id: ctx.tenantId,
      face_id: parsed.data.faceId,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      state: parsed.data.state,
      source: parsed.data.source,
      customer_id: parsed.data.customerId ?? null,
      campaign_id: parsed.data.campaignId ?? null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "OCCUPANCY_CREATED",
    entityType: "occupancy",
    entityId: data.id,
    newData: parsed.data,
  });

  await supabase.rpc("refresh_tenant_operational_alerts", { p_tenant: ctx.tenantId });
  revalidatePath("/manage/occupancy");
  revalidatePath("/manage");
  return { id: data.id };
}

export async function createHoldAction(input: unknown) {
  const parsed = occupancySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid hold." };
  return createOccupancyAction({ ...parsed.data, state: "on_hold", source: "manual" });
}

export async function blockDatesAction(input: unknown) {
  const parsed = occupancySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid blocked period." };
  return createOccupancyAction({ ...parsed.data, state: "blocked", source: "manual" });
}

export async function updateOccupancyAction(input: unknown) {
  const ctx = await requirePermission("occupancy.manage");
  const parsed = updateOccupancySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid occupancy." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("occupancy_periods")
    .select("id, face_id")
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!row) return { error: "Occupancy period not found." };

  const { data: existing, error: existingError } = await loadFacePeriods(
    supabase,
    ctx.tenantId,
    row.face_id,
  );
  if (existingError) return { error: toErrorMessage(existingError) };

  const conflicts = occupancyConflicts(
    {
      id: parsed.data.id,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      state: parsed.data.state,
    },
    existing ?? [],
  );
  if (conflicts.length) {
    return { error: occupancyConflictMessage(parsed.data.state, conflicts) };
  }

  const { error } = await supabase
    .from("occupancy_periods")
    .update({
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      state: parsed.data.state,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "OCCUPANCY_UPDATED",
    entityType: "occupancy",
    entityId: parsed.data.id,
    newData: parsed.data,
  });

  await supabase.rpc("refresh_tenant_operational_alerts", { p_tenant: ctx.tenantId });
  revalidatePath("/manage/occupancy");
  revalidatePath("/manage");
  return { ok: true };
}

export async function cancelOccupancyAction(id: string) {
  const ctx = await requirePermission("occupancy.manage");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("occupancy_periods")
    .select("id, face_id, start_date, end_date, state")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!row) return { error: "Occupancy period not found." };

  const { error } = await supabase.from("occupancy_periods").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "OCCUPANCY_CANCELLED",
    entityType: "occupancy",
    entityId: id,
    oldData: row,
  });

  await supabase.rpc("refresh_tenant_operational_alerts", { p_tenant: ctx.tenantId });
  revalidatePath("/manage/occupancy");
  revalidatePath("/manage");
  return { ok: true };
}

/** @deprecated Use cancelOccupancyAction */
export async function deleteOccupancyAction(id: string) {
  return cancelOccupancyAction(id);
}

export async function publishVacancyListingAction(faceId: string) {
  const ctx = await requirePermission("marketplace.publish");
  const supabase = await createClient();
  const { data: face } = await supabase
    .from("board_faces")
    .select("id, board_id, archived_at, marketplace_visible, publishable")
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!face) return { error: "Face not found." };
  if (face.archived_at) return { error: "Restore this face before publishing." };

  const { data: dimension } = await supabase.rpc("face_occupancy_dimension", {
    p_face_id: faceId,
  });
  if (dimension !== "vacant" && dimension !== "becoming_vacant" && dimension !== "booked_future") {
    return { error: "Only vacant or upcoming faces can be pre-listed from the vacancy date." };
  }

  const { publishFaceAction } = await import("@/lib/boards/actions");
  const result = await publishFaceAction(faceId, true);
  if (result.error) return { error: result.error };

  const { data: availableFrom } = await supabase.rpc("face_available_from", { p_face_id: faceId });
  revalidatePath("/manage/occupancy");
  revalidatePath("/market");
  return { ok: true, availableFrom };
}

export { OCCUPANCY_OVERLAP_MESSAGE };
