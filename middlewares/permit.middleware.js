import { PERMS } from "../rbac/permissions.js";

export function requirePerm(...required) {
  return (req, res, next) => {
    const a = req.auth;
    if (!a) return res.status(401).json({ message: "Unauthorized" });

    // superadmin bypass tenant checks
    if (a.isSuperAdmin) return next();

    if (!a.tenantId) {
      return res.status(400).json({ message: "Tenant context required" });
    }

    for (const p of required) {
      if (!a.perms.has(p)) {
        return res.status(403).json({ message: `Missing permission: ${p}` });
      }
    }
    next();
  };
}

// Optional: system-level perms (you can just check isSuperAdmin)
export function requireSystemPerm(..._perms) {
  return (req, res, next) => {
    const a = req.auth;
    if (!a) return res.status(401).json({ message: "Unauthorized" });
    if (!a.isSuperAdmin) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
