"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { roleHasPermission, type AppRole } from "@/lib/permissions/catalog";
import { assertImageFile, storagePath } from "@/lib/storage/validate";
import { createClient } from "@/lib/supabase/server";
import { fieldJobSchema } from "@/lib/validation/schemas";

async function loadAssignedJob(jobId: string, tenantId: string, userId: string, role: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("field_jobs")
    .select("id, board_id, face_id, assigned_to, status, job_type, qr_verified_at")
    .eq("id", jobId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!job) return { error: "Job not found." as const };
  if (job.assigned_to !== userId && !roleHasPermission(role as AppRole, "field.manage")) {
    return { error: "This job is not assigned to you." as const };
  }
  return { job, supabase };
}

export async function createFieldJobAction(formData: FormData) {
  const ctx = await requirePermission("field.manage");
  const parsed = fieldJobSchema.safeParse({
    boardId: formData.get("boardId"),
    faceId: formData.get("faceId") || null,
    jobType: formData.get("jobType"),
    title: formData.get("title"),
    description: formData.get("description"),
    assignedTo: formData.get("assignedTo") || null,
    scheduledAt: formData.get("scheduledAt"),
    priority: formData.get("priority") || "medium",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid job." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_jobs")
    .insert({
      tenant_id: ctx.tenantId,
      board_id: parsed.data.boardId,
      face_id: parsed.data.faceId || null,
      job_type: parsed.data.jobType,
      title: parsed.data.title,
      description: parsed.data.description || null,
      assigned_to: parsed.data.assignedTo || null,
      scheduled_at: parsed.data.scheduledAt || null,
      priority: parsed.data.priority,
      status: parsed.data.assignedTo ? "assigned" : "pending",
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "FIELD_JOB_CREATED",
    entityType: "field_job",
    entityId: data.id,
    newData: {
      boardId: parsed.data.boardId,
      jobType: parsed.data.jobType,
      assignedTo: parsed.data.assignedTo,
    },
  });
  revalidatePath("/manage/field-jobs");
  revalidatePath("/field");
  return { id: data.id };
}

export async function startJobAction(jobId: string) {
  const ctx = await requireTenant();
  if (!roleHasPermission(ctx.role, "field.view")) {
    return { error: "You do not have permission to do that." };
  }
  const loaded = await loadAssignedJob(jobId, ctx.tenantId, ctx.userId, ctx.role);
  if ("error" in loaded) return { error: loaded.error };
  if (loaded.job.status === "completed" || loaded.job.status === "cancelled") {
    return { error: "This job is already closed." };
  }

  const { error } = await loaded.supabase
    .from("field_jobs")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/field");
  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true };
}

export async function verifyJobQrAction(jobId: string, qrSlug: string) {
  const ctx = await requireTenant();
  if (!roleHasPermission(ctx.role, "field.view")) {
    return { error: "You do not have permission to do that." };
  }
  const loaded = await loadAssignedJob(jobId, ctx.tenantId, ctx.userId, ctx.role);
  if ("error" in loaded) return { error: loaded.error };

  const { data: board } = await loaded.supabase
    .from("boards")
    .select("id, qr_slug, name, board_code")
    .eq("id", loaded.job.board_id)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!board || board.qr_slug !== qrSlug.trim()) {
    return { error: "QR does not match this board. Check you are at the right site." };
  }

  const { error } = await loaded.supabase
    .from("field_jobs")
    .update({ qr_verified_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true, boardName: board.name, boardCode: board.board_code };
}

export async function lookupBoardQrAction(qrSlug: string) {
  const ctx = await requireTenant();
  if (!roleHasPermission(ctx.role, "field.view") && !roleHasPermission(ctx.role, "boards.view")) {
    return { error: "You do not have permission to do that." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_tenant_board_qr", {
    p_qr_slug: qrSlug.trim(),
  });
  if (error) return { error: toErrorMessage(error) };
  const board = Array.isArray(data) ? data[0] : data;
  if (!board) return { error: "No board found for this QR code." };
  return {
    board: {
      id: board.id as string,
      name: board.name as string,
      board_code: board.board_code as string,
      locality: board.locality as string | null,
      city: board.city as string | null,
      qr_slug: board.qr_slug as string,
    },
  };
}

export async function completeJobAction(jobId: string) {
  const ctx = await requireTenant();
  if (!roleHasPermission(ctx.role, "field.view")) {
    return { error: "You do not have permission to do that." };
  }
  const loaded = await loadAssignedJob(jobId, ctx.tenantId, ctx.userId, ctx.role);
  if ("error" in loaded) return { error: loaded.error };
  if (loaded.job.job_type === "proof_capture") {
    return { error: "Proof of display jobs require a photo with GPS before completion." };
  }

  const { error } = await loaded.supabase
    .from("field_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  await writeAuditLog(loaded.supabase, {
    tenantId: ctx.tenantId,
    action: "FIELD_JOB_COMPLETED",
    entityType: "field_job",
    entityId: jobId,
    newData: { status: "completed" },
  });
  revalidatePath("/field");
  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true };
}

export async function completeJobWithProofAction(formData: FormData) {
  const ctx = await requireTenant();
  if (!roleHasPermission(ctx.role, "field.view")) {
    return { error: "You do not have permission to do that." };
  }

  const jobId = String(formData.get("jobId") || "");
  const file = formData.get("photo");
  const capturedAt = String(formData.get("capturedAt") || "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const accuracy = formData.get("accuracy") ? Number(formData.get("accuracy")) : null;
  const notes = String(formData.get("notes") || "");

  if (!(file instanceof File) || file.size === 0) return { error: "A proof photo is required." };
  try {
    assertImageFile(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid photo." };
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "GPS coordinates are required for proof of display." };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: "GPS coordinates look invalid. Capture location again." };
  }
  if (!capturedAt) return { error: "Capture timestamp is required." };

  const loaded = await loadAssignedJob(jobId, ctx.tenantId, ctx.userId, ctx.role);
  if ("error" in loaded) return { error: loaded.error };
  const { job, supabase } = loaded;

  if (job.status === "pending") {
    return { error: "Start the job before capturing proof." };
  }
  if (job.status === "completed" || job.status === "cancelled") {
    return { error: "This job is already closed." };
  }

  // Ensure status allows proof insert RLS (assigned | in_progress).
  if (job.status === "assigned") {
    await supabase
      .from("field_jobs")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("tenant_id", ctx.tenantId);
  }

  const path = storagePath(ctx.tenantId, "proof", jobId, `${Date.now()}.jpg`);
  const { error: uploadError } = await supabase.storage.from("proof-of-display").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (uploadError) return { error: "Could not upload proof photo. It has been kept in your offline queue." };

  const { data: proof, error: proofError } = await supabase
    .from("proof_records")
    .insert({
      tenant_id: ctx.tenantId,
      field_job_id: jobId,
      board_id: job.board_id,
      face_id: job.face_id,
      photo_storage_path: path,
      captured_at: capturedAt,
      latitude,
      longitude,
      accuracy_meters: accuracy,
      captured_by: ctx.userId,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (proofError) return { error: toErrorMessage(proofError) };

  const { error: jobError } = await supabase
    .from("field_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("tenant_id", ctx.tenantId);
  if (jobError) return { error: toErrorMessage(jobError) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "PROOF_UPLOADED",
    entityType: "proof",
    entityId: proof.id,
    newData: { jobId, latitude, longitude, capturedAt },
  });
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "FIELD_JOB_COMPLETED",
    entityType: "field_job",
    entityId: jobId,
    newData: { status: "completed" },
  });

  revalidatePath("/field");
  revalidatePath(`/field/jobs/${jobId}`);
  revalidatePath("/manage/field-jobs");
  return { ok: true, proofId: proof.id };
}
