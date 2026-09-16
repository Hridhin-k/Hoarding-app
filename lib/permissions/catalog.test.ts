import { describe, expect, it } from "vitest";
import {
  ROLE_PERMISSIONS,
  roleHasPermission,
  type AppRole,
  type Permission,
} from "@/lib/permissions/catalog";

const ADMIN_ONLY: Permission[] = ["team.manage", "settings.manage", "audit.view", "boards.delete"];

describe("permission catalog", () => {
  it("gives technicians field.view only", () => {
    expect(ROLE_PERMISSIONS.TECHNICIAN).toEqual(["field.view"]);
    expect(roleHasPermission("TECHNICIAN", "field.view")).toBe(true);
    expect(roleHasPermission("TECHNICIAN", "boards.view")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "occupancy.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "team.manage")).toBe(false);
  });

  it("lets sales manage occupancy and publish, but not team or settings", () => {
    expect(roleHasPermission("SALES", "occupancy.manage")).toBe(true);
    expect(roleHasPermission("SALES", "marketplace.publish")).toBe(true);
    expect(roleHasPermission("SALES", "enquiries.manage")).toBe(true);
    expect(roleHasPermission("SALES", "team.manage")).toBe(false);
    expect(roleHasPermission("SALES", "settings.manage")).toBe(false);
    expect(roleHasPermission("SALES", "boards.create")).toBe(false);
    expect(roleHasPermission("SALES", "field.manage")).toBe(false);
  });

  it("gives admin the same operational surface as owner", () => {
    expect([...ROLE_PERMISSIONS.ADMIN].sort()).toEqual([...ROLE_PERMISSIONS.OWNER].sort());
    for (const permission of ADMIN_ONLY) {
      expect(roleHasPermission("ADMIN", permission)).toBe(true);
      expect(roleHasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("keeps ops from deleting boards or managing the team", () => {
    expect(roleHasPermission("OPS_MANAGER", "boards.create")).toBe(true);
    expect(roleHasPermission("OPS_MANAGER", "field.manage")).toBe(true);
    expect(roleHasPermission("OPS_MANAGER", "boards.delete")).toBe(false);
    expect(roleHasPermission("OPS_MANAGER", "team.manage")).toBe(false);
    expect(roleHasPermission("OPS_MANAGER", "marketplace.publish")).toBe(false);
  });

  it("does not authorize by role name in helper — only the catalog matrix", () => {
    const role: AppRole = "ADMIN";
    expect(role === "ADMIN" && roleHasPermission(role, "audit.view")).toBe(true);
    expect(roleHasPermission("SALES", "audit.view")).toBe(false);
  });
});
