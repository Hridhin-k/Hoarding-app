"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { AppError, toErrorMessage } from "@/lib/errors";
import { signedUrl } from "@/lib/storage/signed-url";
import { assertDocumentFile, storagePath } from "@/lib/storage/validate";
import { createClient } from "@/lib/supabase/server";
import { complianceSchema } from "@/lib/validation/schemas";

const DOCUMENT_ENTITY_TYPES = [
  "board",
  "face",
  "compliance",
  "agreement",
  "organization",
  "customer",
  "field_job",
] as const;

function parseComplianceForm(formData: FormData) {
  return complianceSchema.safeParse({
    clearanceType: formData.get("clearanceType"),
    authority: formData.get("authority"),
    referenceNumber: formData.get("referenceNumber"),
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate"),
    renewalCycle: formData.get("renewalCycle"),
    isMandatory: formData.get("isMandatory") !== "false",
    notes: formData.get("notes"),
  });
}

async function uploadPrivateDocument(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ctx: { tenantId: string; userId: string },
  file: File,
  entityType: (typeof DOCUMENT_ENTITY_TYPES)[number],
  entityId: string,
  documentType: string,
) {
  try {
    assertDocumentFile(file);
  } catch (e) {
    return { error: e instanceof AppError ? e.message : "Invalid file." };
  }

  const path = storagePath(ctx.tenantId, entityType, entityId, `${Date.now()}-${file.name}`);
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { error: "Could not upload the file." };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: ctx.tenantId,
      entity_type: entityType,
      entity_id: entityId,
      document_type: documentType,
      file_name: file.name,
      storage_path: path,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };
  return { id: data.id };
}

export async function createComplianceAction(boardId: string, formData: FormData) {
  const ctx = await requirePermission("compliance.manage");
  const parsed = parseComplianceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid compliance record." };

  const supabase = await createClient();
  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!board) return { error: "Board not found." };

  const { data, error } = await supabase
    .from("compliance_records")
    .insert({
      tenant_id: ctx.tenantId,
      board_id: boardId,
      clearance_type: parsed.data.clearanceType,
      authority: parsed.data.authority || null,
      reference_number: parsed.data.referenceNumber || null,
      issue_date: parsed.data.issueDate || null,
      expiry_date: parsed.data.expiryDate || null,
      renewal_cycle: parsed.data.renewalCycle || null,
      is_mandatory: parsed.data.isMandatory,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPrivateDocument(
      supabase,
      ctx,
      file,
      "compliance",
      data.id,
      parsed.data.clearanceType,
    );
    if ("error" in uploaded && uploaded.error) return { error: uploaded.error };
    if ("id" in uploaded && uploaded.id) {
      await supabase
        .from("compliance_records")
        .update({ document_id: uploaded.id })
        .eq("id", data.id)
        .eq("tenant_id", ctx.tenantId);
    }
  }

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "COMPLIANCE_UPDATED",
    entityType: "compliance",
    entityId: data.id,
    newData: parsed.data,
  });
  revalidatePath("/manage/compliance");
  revalidatePath("/manage/documents");
  revalidatePath(`/manage/boards/${boardId}`);
  return { id: data.id };
}

export async function updateComplianceAction(complianceId: string, formData: FormData) {
  const ctx = await requirePermission("compliance.manage");
  const parsed = parseComplianceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid compliance record." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("compliance_records")
    .select("id, board_id")
    .eq("id", complianceId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!existing) return { error: "Compliance record not found." };

  const { error } = await supabase
    .from("compliance_records")
    .update({
      clearance_type: parsed.data.clearanceType,
      authority: parsed.data.authority || null,
      reference_number: parsed.data.referenceNumber || null,
      issue_date: parsed.data.issueDate || null,
      expiry_date: parsed.data.expiryDate || null,
      renewal_cycle: parsed.data.renewalCycle || null,
      is_mandatory: parsed.data.isMandatory,
      notes: parsed.data.notes || null,
    })
    .eq("id", complianceId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPrivateDocument(
      supabase,
      ctx,
      file,
      "compliance",
      complianceId,
      parsed.data.clearanceType,
    );
    if ("error" in uploaded && uploaded.error) return { error: uploaded.error };
    if ("id" in uploaded && uploaded.id) {
      await supabase
        .from("compliance_records")
        .update({ document_id: uploaded.id })
        .eq("id", complianceId)
        .eq("tenant_id", ctx.tenantId);
    }
  }

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "COMPLIANCE_UPDATED",
    entityType: "compliance",
    entityId: complianceId,
    newData: parsed.data,
  });
  revalidatePath("/manage/compliance");
  revalidatePath("/manage/documents");
  revalidatePath(`/manage/boards/${existing.board_id}`);
  return { ok: true };
}

export async function uploadDocumentAction(formData: FormData) {
  const ctx = await requirePermission("documents.manage");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  const entityType = String(formData.get("entityType") || "");
  const entityId = String(formData.get("entityId") || "");
  const documentType = String(formData.get("documentType") || "other").slice(0, 80);
  if (!entityType || !entityId) return { error: "Missing document target." };
  if (!DOCUMENT_ENTITY_TYPES.includes(entityType as (typeof DOCUMENT_ENTITY_TYPES)[number])) {
    return { error: "Invalid document target." };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entityId)) {
    return { error: "Invalid document target." };
  }

  const supabase = await createClient();
  const uploaded = await uploadPrivateDocument(
    supabase,
    ctx,
    file,
    entityType as (typeof DOCUMENT_ENTITY_TYPES)[number],
    entityId,
    documentType,
  );
  if ("error" in uploaded && uploaded.error) return { error: uploaded.error };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "DOCUMENT_UPLOADED",
    entityType: "document",
    entityId: uploaded.id!,
    newData: { entityType, documentType, fileName: file.name, fileSize: file.size },
  });

  revalidatePath("/manage/documents");
  return { id: uploaded.id };
}

export async function attachComplianceDocumentAction(complianceId: string, documentId: string) {
  const ctx = await requirePermission("compliance.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("compliance_records")
    .update({ document_id: documentId })
    .eq("id", complianceId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/manage/compliance");
  return { ok: true };
}

export async function getDocumentSignedUrlAction(documentId: string) {
  const ctx = await requirePermission("documents.view");
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, tenant_id")
    .eq("id", documentId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  const url = await signedUrl("documents", doc.storage_path);
  if (!url) return { error: "Could not create a download link." };
  return { url };
}
