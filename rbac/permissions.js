export const PERMS = Object.freeze({
  // System-level (not scoped to a tenant)
  SYS_LOGS_READ: "sys:logs:read",
  SYS_USERS_MANAGE: "sys:users:manage",

  // Tenant-scoped
  TENANT_READ: "tenant:read",
  TENANT_UPDATE: "tenant:update",

  MEMBERS_INVITE: "members:invite",
  MEMBERS_READ: "members:read",
  MEMBERS_UPDATE: "members:update",
  MEMBERS_REMOVE: "members:remove",

  ROLES_READ: "roles:read",
  ROLES_UPDATE: "roles:update",

  // Your app domain
  PROJECT_READ: "project:read",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  LOGS_READ: "logs:read", // tenant logs if you keep per-tenant logs
});

export const ALL_TENANT_PERMS = Object.values(PERMS).filter(p => !p.startsWith("sys:"));
