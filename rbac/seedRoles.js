import { PERMS } from "./permissions.js";
import Role from "../models/Role.js";

export async function seedDefaultRoles(tenantId) {
  const base = {
    tenant: tenantId,
    isSystem: false, // system roles would be separate if you need them
  };

  const OWNER = {
    ...base,
    name: "owner",
    permissions: Object.values(PERMS).filter((p) => !p.startsWith("sys:")), // all tenant perms
  };

  const ADMIN = {
    ...base,
    name: "admin",
    permissions: [
      PERMS.TENANT_READ,
      PERMS.TENANT_UPDATE,
      PERMS.MEMBERS_INVITE,
      PERMS.MEMBERS_READ,
      PERMS.MEMBERS_UPDATE,
      PERMS.MEMBERS_REMOVE,
      PERMS.ROLES_READ,
      PERMS.ROLES_UPDATE,
      PERMS.PROJECT_READ,
      PERMS.PROJECT_CREATE,
      PERMS.PROJECT_UPDATE,
      PERMS.PROJECT_DELETE,
      PERMS.LOGS_READ,
    ],
  };

  const MEMBER = {
    ...base,
    name: "member",
    permissions: [
      PERMS.PROJECT_READ,
      PERMS.PROJECT_CREATE,
      PERMS.PROJECT_UPDATE,
    ],
  };

  const VIEWER = {
    ...base,
    name: "viewer",
    permissions: [PERMS.PROJECT_READ],
  };

  const wanted = [OWNER, ADMIN, MEMBER, VIEWER];
  for (const r of wanted) {
    await Role.findOneAndUpdate({ tenant: r.tenant, name: r.name }, r, {
      upsert: true,
      new: true,
    });
  }
}
