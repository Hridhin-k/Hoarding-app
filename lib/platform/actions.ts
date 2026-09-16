"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PLATFORM_INSPECT_COOKIE, PLATFORM_INSPECT_MINUTES } from "@/lib/constants";
import { requirePlatformStaff } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type PlatformActionState = { error?: string } | null;

export async function startInspectAction(
  tenantId: string,
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  await requirePlatformStaff();
  const reason = String(formData.get("reason") || "").trim();
  if (reason.length < 8) return { error: "Enter a reason of at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_start_inspect", {
    p_tenant: tenantId,
    p_reason: reason,
  });
  if (error) return { error: toErrorMessage(error) };

  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_INSPECT_COOKIE, String(data), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: PLATFORM_INSPECT_MINUTES * 60,
  });
  revalidatePath(`/platform/tenants/${tenantId}`);
  redirect(`/platform/tenants/${tenantId}`);
}

export async function setTenantStatusAction(tenantId: string, formData: FormData) {
  const staff = await requirePlatformStaff();
  if (staff.role !== "SUPER_ADMIN") return { error: "Only platform super admins can change tenant status." };

  const status = String(formData.get("status") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (status !== "active" && status !== "suspended") return { error: "Invalid status." };
  if (reason.length < 8) return { error: "Enter a reason of at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_set_tenant_status", {
    p_tenant: tenantId,
    p_status: status,
    p_reason: reason,
  });
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/platform");
  revalidatePath("/platform/tenants");
  revalidatePath(`/platform/tenants/${tenantId}`);
  return { ok: true as const };
}
