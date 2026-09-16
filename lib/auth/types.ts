import type { AppRole, Permission } from "@/lib/permissions/catalog";

export type TenantContext = {
  userId: string;
  email: string | undefined;
  fullName: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: "active" | "suspended" | "pending";
  role: AppRole;
  permissions: Permission[];
};

export type PlatformStaffRole = "SUPER_ADMIN" | "SUPPORT";

export type PlatformStaffContext = {
  userId: string;
  email: string | undefined;
  fullName: string;
  role: PlatformStaffRole;
};
