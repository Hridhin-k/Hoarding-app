"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { campaignSchema, customerSchema, enquirySchema } from "@/lib/validation/schemas";
import type { EnquiryStatus } from "@/lib/types/enums";

export async function submitPublicEnquiryAction(faceId: string, formData: FormData) {
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    requestedStartDate: formData.get("requestedStartDate"),
    requestedEndDate: formData.get("requestedEndDate"),
    website: formData.get("website"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid enquiry." };
  if (parsed.data.website) return { ok: true };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "0.0.0.0";
  const ipHash = createHash("sha256").update(ip).digest("hex");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_marketplace_enquiry", {
    p_face_id: faceId,
    p_name: parsed.data.name,
    p_company_name: parsed.data.companyName || "",
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_message: parsed.data.message || "",
    p_start: parsed.data.requestedStartDate || null,
    p_end: parsed.data.requestedEndDate || null,
    p_ip_hash: ipHash,
  });
  if (error) return { error: toErrorMessage(error) };
  return { id: data as string };
}

export async function updateEnquiryStatusAction(enquiryId: string, status: EnquiryStatus) {
  const ctx = await requirePermission("enquiries.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", enquiryId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "ENQUIRY_STATUS_CHANGED",
    entityType: "enquiry",
    entityId: enquiryId,
    newData: { status },
  });
  revalidatePath("/manage/enquiries");
  revalidatePath(`/manage/enquiries/${enquiryId}`);
  return { ok: true };
}

export async function assignEnquiryAction(enquiryId: string, userId: string | null) {
  const ctx = await requirePermission("enquiries.manage");
  const supabase = await createClient();
  if (userId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", ctx.tenantId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (!member) return { error: "Assignee must be an active organization member." };
  }
  const { error } = await supabase
    .from("enquiries")
    .update({ assigned_to: userId })
    .eq("id", enquiryId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "ENQUIRY_ASSIGNED",
    entityType: "enquiry",
    entityId: enquiryId,
    newData: { assigned_to: userId },
  });
  revalidatePath("/manage/enquiries");
  revalidatePath(`/manage/enquiries/${enquiryId}`);
  return { ok: true };
}

export async function convertEnquiryToCustomerAction(enquiryId: string) {
  const ctx = await requirePermission("customers.manage");
  const supabase = await createClient();
  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!enquiry) return { error: "Enquiry not found." };
  if (enquiry.customer_id) return { id: enquiry.customer_id };

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: ctx.tenantId,
      name: enquiry.name,
      company_name: enquiry.company_name,
      email: enquiry.email,
      phone: enquiry.phone,
      type: "advertiser",
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };

  const { error: linkError } = await supabase
    .from("enquiries")
    .update({ customer_id: customer.id })
    .eq("id", enquiryId)
    .eq("tenant_id", ctx.tenantId);
  if (linkError) return { error: toErrorMessage(linkError) };

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "ENQUIRY_CONVERTED_CUSTOMER",
    entityType: "enquiry",
    entityId: enquiryId,
    newData: { customer_id: customer.id },
  });

  revalidatePath("/manage/enquiries");
  revalidatePath(`/manage/enquiries/${enquiryId}`);
  revalidatePath("/manage/customers");
  return { id: customer.id };
}

export async function createCustomerAction(formData: FormData) {
  const ctx = await requirePermission("customers.manage");
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    type: formData.get("type") || "advertiser",
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid customer." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: ctx.tenantId,
      name: parsed.data.name,
      company_name: parsed.data.companyName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      type: parsed.data.type,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };
  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "CUSTOMER_CREATED",
    entityType: "customer",
    entityId: data.id,
    newData: { name: parsed.data.name, type: parsed.data.type },
  });
  revalidatePath("/manage/customers");
  return { id: data.id };
}

export async function createCampaignAction(formData: FormData) {
  const ctx = await requirePermission("campaigns.manage");
  const faceIds = formData
    .getAll("faceIds")
    .map(String)
    .filter(Boolean);
  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    customerId: formData.get("customerId") || null,
    faceIds,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status") || "draft",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid campaign." };
  const supabase = await createClient();

  if (parsed.data.customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", parsed.data.customerId)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    if (!customer) return { error: "Customer not found." };
  }

  if (parsed.data.faceIds.length) {
    const { data: faces } = await supabase
      .from("board_faces")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .in("id", parsed.data.faceIds);
    if ((faces ?? []).length !== parsed.data.faceIds.length) {
      return { error: "One or more faces could not be found in your organization." };
    }
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      tenant_id: ctx.tenantId,
      name: parsed.data.name,
      customer_id: parsed.data.customerId || null,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();
  if (error) return { error: toErrorMessage(error) };

  if (parsed.data.faceIds.length) {
    const { error: linkError } = await supabase.from("campaign_faces").insert(
      parsed.data.faceIds.map((faceId) => ({
        tenant_id: ctx.tenantId,
        campaign_id: data.id,
        face_id: faceId,
      })),
    );
    if (linkError) return { error: toErrorMessage(linkError) };
  }

  await writeAuditLog(supabase, {
    tenantId: ctx.tenantId,
    action: "CAMPAIGN_CREATED",
    entityType: "campaign",
    entityId: data.id,
    newData: { name: parsed.data.name, faceIds: parsed.data.faceIds },
  });

  revalidatePath("/manage/campaigns");
  return { id: data.id };
}
