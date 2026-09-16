"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { isMarketplaceEligible, marketplaceBlockReason } from "@/lib/marketplace/eligibility";
import { createClient } from "@/lib/supabase/server";
import { boardBasicsSchema, boardLocationSchema, faceSchema } from "@/lib/validation/schemas";
import { boardComplianceStatus } from "@/lib/compliance/board-compliance";
import { faceOccupancyDimension } from "@/lib/occupancy/status";
import type { BoardLifecycle, OccupancyDimension } from "@/lib/types/enums";

export async function createBoardAction(formData: FormData) {
  const ctx = await requirePermission("boards.create");
  const parsed = boardBasicsSchema.safeParse({
    boardCode: formData.get("boardCode"),
    name: formData.get("name"),
    description: formData.get("description"),
    structureType: formData.get("structureType"),
    ownershipType: formData.get("ownershipType"),
    lifecycleStatus: formData.get("lifecycleStatus") || "draft",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid board." };

  const location = boardLocationSchema.safeParse({
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    address: formData.get("address"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    district: formData.get("district"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    landmark: formData.get("landmark"),
  });
  if (!location.success) return { error: location.error.issues[0]?.message ?? "Invalid location." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .insert({
      tenant_id: ctx.tenantId,
      board_code: parsed.data.boardCode,
      name: parsed.data.name,
      description: parsed.data.description || null,
      structure_type: parsed.data.structureType,
      ownership_type: parsed.data.ownershipType,
      lifecycle_status: parsed.data.lifecycleStatus,
      address: location.data.address || null,
      locality: location.data.locality || null,
      city: location.data.city,
      district: location.data.district || null,
      state: location.data.state,
      pincode: location.data.pincode || null,
      landmark: location.data.landmark || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: toErrorMessage(error) };

  if (location.data.latitude != null && location.data.longitude != null) {
    const { error: locError } = await supabase.rpc("set_board_location", {
      p_board_id: data.id,
      p_lng: location.data.longitude,
      p_lat: location.data.latitude,
    });
    if (locError) return { error: toErrorMessage(locError) };
  }

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "BOARD_CREATED",
    entityType: "board",
    entityId: data.id,
    newData: { name: parsed.data.name, board_code: parsed.data.boardCode },
  });

  revalidatePath("/manage/boards");
  return { id: data.id };
}

export async function updateBoardAction(boardId: string, formData: FormData) {
  const ctx = await requirePermission("boards.update");
  const parsed = boardBasicsSchema.safeParse({
    boardCode: formData.get("boardCode"),
    name: formData.get("name"),
    description: formData.get("description"),
    structureType: formData.get("structureType"),
    ownershipType: formData.get("ownershipType"),
    lifecycleStatus: formData.get("lifecycleStatus") || "draft",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid board." };

  const location = boardLocationSchema.safeParse({
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    address: formData.get("address"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    district: formData.get("district"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    landmark: formData.get("landmark"),
  });
  if (!location.success) return { error: location.error.issues[0]?.message ?? "Check the location details." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("boards")
    .update({
      board_code: parsed.data.boardCode,
      name: parsed.data.name,
      description: parsed.data.description || null,
      structure_type: parsed.data.structureType,
      ownership_type: parsed.data.ownershipType,
      lifecycle_status: parsed.data.lifecycleStatus,
      address: location.data.address || null,
      locality: location.data.locality || null,
      city: location.data.city,
      district: location.data.district || null,
      state: location.data.state,
      pincode: location.data.pincode || null,
      landmark: location.data.landmark || null,
    })
    .eq("id", boardId)
    .eq("tenant_id", ctx.tenantId);

  if (error) return { error: toErrorMessage(error) };

  if (location.data.latitude != null && location.data.longitude != null) {
    const { error: locError } = await supabase.rpc("set_board_location", {
      p_board_id: boardId,
      p_lng: location.data.longitude,
      p_lat: location.data.latitude,
    });
    if (locError) return { error: toErrorMessage(locError) };
  }

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "BOARD_UPDATED",
    entityType: "board",
    entityId: boardId,
    newData: { name: parsed.data.name },
  });

  revalidatePath("/manage/boards");
  revalidatePath(`/manage/boards/${boardId}`);
  return { ok: true };
}

export async function retireBoardAction(boardId: string) {
  const ctx = await requirePermission("boards.update");
  const supabase = await createClient();
  const { error } = await supabase
    .from("boards")
    .update({ lifecycle_status: "retired" })
    .eq("id", boardId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await supabase.from("board_faces").update({ marketplace_visible: false, publishable: false }).eq("board_id", boardId);

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "BOARD_DELETED",
    entityType: "board",
    entityId: boardId,
    newData: { lifecycle_status: "retired" },
  });
  revalidatePath("/manage/boards");
  return { ok: true };
}

export async function upsertFaceAction(boardId: string, input: unknown) {
  const parsed = faceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid face." };

  const ctx = parsed.data.id
    ? await requirePermission("faces.update")
    : await requirePermission("faces.create");

  const supabase = await createClient();
  const payload = {
    tenant_id: ctx.tenantId,
    board_id: boardId,
    face_label: parsed.data.faceLabel,
    direction: parsed.data.direction || null,
    width: parsed.data.width,
    height: parsed.data.height,
    unit: parsed.data.unit,
    illumination: parsed.data.illumination,
    visibility_notes: parsed.data.visibilityNotes || null,
    card_rate: parsed.data.cardRate ?? null,
    floor_rate: parsed.data.floorRate ?? null,
    publishable: parsed.data.publishable,
    marketplace_visible: parsed.data.marketplaceVisible,
  };

  if (parsed.data.marketplaceVisible) {
    const blocked = await assertFacePublishable(supabase, boardId, parsed.data.id);
    if (blocked) return { error: blocked };
  }

  if (parsed.data.id) {
    const { data: existing } = await supabase
      .from("board_faces")
      .select("id, archived_at")
      .eq("id", parsed.data.id)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    if (!existing) return { error: "Face not found." };
    if (existing.archived_at) return { error: "Restore this face before editing it." };

    const { error } = await supabase.from("board_faces").update(payload).eq("id", parsed.data.id).eq("tenant_id", ctx.tenantId);
    if (error) return { error: toErrorMessage(error) };
    await writeAuditLog(supabase, {
      tenantId: ctx.tenantId,
      action: "FACE_UPDATED",
      entityType: "face",
      entityId: parsed.data.id,
      newData: payload,
    });
    revalidatePath(`/manage/boards/${boardId}`);
    return { id: parsed.data.id };
  }

  const { data, error } = await supabase.from("board_faces").insert(payload).select("id").single();
  if (error || !data) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "FACE_CREATED",
    entityType: "face",
    entityId: data.id,
    newData: payload,
  });
  revalidatePath(`/manage/boards/${boardId}`);
  return { id: data.id };
}

export async function archiveFaceAction(faceId: string) {
  const ctx = await requirePermission("faces.delete");
  const supabase = await createClient();
  const { data: face, error: findError } = await supabase
    .from("board_faces")
    .select("id, board_id, archived_at")
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (findError || !face) return { error: "Face not found." };
  if (face.archived_at) return { error: "Face is already archived." };

  const { error } = await supabase
    .from("board_faces")
    .update({
      archived_at: new Date().toISOString(),
      marketplace_visible: false,
      publishable: false,
    })
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "FACE_ARCHIVED",
    entityType: "face",
    entityId: faceId,
    newData: { archived: true },
  });
  revalidatePath(`/manage/boards/${face.board_id}`);
  revalidatePath("/market");
  return { ok: true };
}

export async function restoreFaceAction(faceId: string) {
  const ctx = await requirePermission("faces.update");
  const supabase = await createClient();
  const { data: face, error: findError } = await supabase
    .from("board_faces")
    .select("id, board_id, archived_at")
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (findError || !face) return { error: "Face not found." };
  if (!face.archived_at) return { error: "Face is not archived." };

  const { error } = await supabase
    .from("board_faces")
    .update({ archived_at: null })
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "FACE_RESTORED",
    entityType: "face",
    entityId: faceId,
    newData: { archived: false },
  });
  revalidatePath(`/manage/boards/${face.board_id}`);
  return { ok: true };
}

export async function publishFaceAction(faceId: string, visible: boolean) {
  const ctx = await requirePermission("marketplace.publish");
  const supabase = await createClient();
  const { data: face } = await supabase
    .from("board_faces")
    .select("id, board_id, marketplace_visible, publishable, archived_at")
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!face) return { error: "Face not found." };
  if (face.archived_at) return { error: "Archived faces cannot be published." };

  if (visible) {
    const blocked = await assertFacePublishable(supabase, face.board_id, faceId);
    if (blocked) return { error: blocked };
  }

  const { error } = await supabase
    .from("board_faces")
    .update({ marketplace_visible: visible, publishable: visible ? true : face.publishable })
    .eq("id", faceId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: visible ? "MARKETPLACE_PUBLISHED" : "MARKETPLACE_UNPUBLISHED",
    entityType: "face",
    entityId: faceId,
    oldData: { marketplace_visible: face.marketplace_visible },
    newData: { marketplace_visible: visible },
  });
  revalidatePath(`/manage/boards/${face.board_id}`);
  revalidatePath("/market");
  return { ok: true };
}

async function assertFacePublishable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boardId: string,
  faceId?: string,
) {
  if (faceId) {
    const { data: face } = await supabase
      .from("board_faces")
      .select("archived_at")
      .eq("id", faceId)
      .maybeSingle();
    if (face?.archived_at) return "Archived faces cannot be published.";
  }
  const { data: board } = await supabase
    .from("boards")
    .select("lifecycle_status")
    .eq("id", boardId)
    .single();
  const compliance = await boardComplianceStatus(supabase, boardId);
  let occupancy: OccupancyDimension = "vacant";
  if (faceId) {
    const { data: periods } = await supabase
      .from("occupancy_periods")
      .select("id, start_date, end_date, state")
      .eq("face_id", faceId);
    occupancy = faceOccupancyDimension(periods ?? []);
  }
  const eligible = isMarketplaceEligible({
    lifecycleStatus: (board?.lifecycle_status ?? "draft") as BoardLifecycle,
    marketplaceVisible: true,
    publishable: true,
    compliance,
    occupancy,
  });
  if (eligible) return null;
  return marketplaceBlockReason({
    lifecycleStatus: (board?.lifecycle_status ?? "draft") as BoardLifecycle,
    marketplaceVisible: true,
    publishable: true,
    compliance,
    occupancy,
  });
}
