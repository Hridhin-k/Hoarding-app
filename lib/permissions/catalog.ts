import type { TenantContext } from "@/lib/auth/types";

export const PERMISSIONS = [
  "boards.view",
  "boards.create",
  "boards.update",
  "boards.delete",
  "faces.view",
  "faces.create",
  "faces.update",
  "faces.delete",
  "compliance.view",
  "compliance.manage",
  "occupancy.view",
  "occupancy.manage",
  "enquiries.view",
  "enquiries.manage",
  "field.view",
  "field.manage",
  "documents.view",
  "documents.manage",
  "team.manage",
  "settings.manage",
  "audit.view",
  "marketplace.publish",
  "customers.view",
  "customers.manage",
  "campaigns.view",
  "campaigns.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const APP_ROLES = [
  "OWNER",
  "ADMIN",
  "OPS_MANAGER",
  "SALES",
  "COMPLIANCE",
  "TECHNICIAN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: PERMISSIONS,
  OPS_MANAGER: [
    "boards.view",
    "boards.create",
    "boards.update",
    "faces.view",
    "faces.create",
    "faces.update",
    "compliance.view",
    "occupancy.view",
    "occupancy.manage",
    "enquiries.view",
    "field.view",
    "field.manage",
    "documents.view",
    "documents.manage",
    "customers.view",
    "campaigns.view",
  ],
  SALES: [
    "boards.view",
    "faces.view",
    "faces.update",
    "occupancy.view",
    "occupancy.manage",
    "enquiries.view",
    "enquiries.manage",
    "documents.view",
    "marketplace.publish",
    "customers.view",
    "customers.manage",
    "campaigns.view",
    "campaigns.manage",
  ],
  COMPLIANCE: [
    "boards.view",
    "faces.view",
    "compliance.view",
    "compliance.manage",
    "documents.view",
    "documents.manage",
  ],
  TECHNICIAN: ["field.view"],
};

export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function can(ctx: Pick<TenantContext, "role">, permission: Permission) {
  return roleHasPermission(ctx.role, permission);
}

export function permissionsForRole(role: AppRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export const ROLE_LABELS: Record<AppRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  OPS_MANAGER: "Operations",
  SALES: "Sales",
  COMPLIANCE: "Compliance",
  TECHNICIAN: "Technician",
};
