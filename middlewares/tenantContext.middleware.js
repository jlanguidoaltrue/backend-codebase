import Membership from "../models/Membership.js";
import Role from "../models/Role.js";

export async function tenantContext(req, res, next) {
  try {
    const user = req.user; // set by auth middleware
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // superadmin bypass (still attach empty tenant context)
    const isSuper = user.role === "superadmin" || user.isSuperAdmin === true;

    const tenantId =
      req.headers["x-org-id"] || req.query.org || user.defaultOrgId || null;

    if (!tenantId && !isSuper) {
      return res
        .status(400)
        .json({ message: "Missing X-Org-Id (tenant) context" });
    }

    let membership = null;
    let role = null;
    let tenantPerms = new Set();

    if (!isSuper && tenantId) {
      membership = await Membership.findOne({
        tenant: tenantId,
        user: user.sub || user.id,
        status: { $ne: "revoked" },
      });

      if (!membership) {
        return res.status(403).json({ message: "Not a member of this tenant" });
      }

      role = await Role.findById(membership.role);
      if (!role) return res.status(403).json({ message: "Role missing" });

      tenantPerms = new Set(role.permissions || []);
    }

    req.auth = {
      userId: user.sub || user.id,
      isSuperAdmin: isSuper,
      tenantId: tenantId || null,
      membershipId: membership?._id || null,
      roleId: role?._id || null,
      perms: tenantPerms,
    };

    next();
  } catch (e) {
    next(e);
  }
}
