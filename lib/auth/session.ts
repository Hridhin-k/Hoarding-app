import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TENANT_COOKIE } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { AppRole, Permission } from "@/lib/permissions/catalog";
import { permissionsForRole, roleHasPermission } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import type { PlatformStaffContext, TenantContext } from "@/lib/auth/types";

export type { PlatformStaffContext, TenantContext } from "@/lib/auth/types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getPlatformStaff(): Promise<PlatformStaffContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("platform_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!staff) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    fullName: profile?.full_name || user.email || "Platform",
    role: staff.role as PlatformStaffContext["role"],
  };
}

export async function requirePlatformStaff(): Promise<PlatformStaffContext> {
  await requireUser();
  const staff = await getPlatformStaff();
  if (!staff) redirect("/login?next=/platform");
  return staff;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const cookieTenant = cookieStore.get(TENANT_COOKIE)?.value;

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, status, organizations(id, name, slug, status)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !memberships?.length) return null;

  const match =
    memberships.find((m) => m.organization_id === cookieTenant) ?? memberships[0];

  const org = Array.isArray(match.organizations)
    ? match.organizations[0]
    : match.organizations;

  if (!org) return null;

  const role = match.role as AppRole;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    fullName: profile?.full_name || user.email || "User",
    tenantId: org.id,
    tenantName: org.name,
    tenantSlug: org.slug,
    tenantStatus: (org.status as TenantContext["tenantStatus"] | undefined) ?? "active",
    role,
    permissions: permissionsForRole(role),
  };
}

export async function requireTenant(): Promise<TenantContext> {
  const user = await requireUser();
  const ctx = await getTenantContext();
  if (!ctx) {
    const staff = await getPlatformStaff();
    if (staff) redirect("/platform");
    redirect("/onboarding");
  }
  if (ctx.userId !== user.id) redirect("/login");
  return ctx;
}

export async function requirePermission(permission: Permission): Promise<TenantContext> {
  const ctx = await requireTenant();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    _tenant: ctx.tenantId,
    _permission: permission,
  });
  if (error || data !== true) {
    throw new AppError("You do not have permission to do that.", "FORBIDDEN", 403);
  }
  return ctx;
}

export function can(ctx: Pick<TenantContext, "role">, permission: Permission) {
  return roleHasPermission(ctx.role, permission);
}
