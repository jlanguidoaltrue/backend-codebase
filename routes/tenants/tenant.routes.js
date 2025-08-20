import express from "express";
import mongoose from "mongoose";
import auth from "../../middlewares/auth.middleware.js";
import { tenantContext } from "../../middlewares/tenantContext.middleware.js";
import { requirePerm } from "../../middlewares/permit.middleware.js";
import { PERMS } from "../../rbac/permissions.js";
import Role from "../../models/rbac/Role.js";
import Invite from "../../models/rbac/Invite.js";
import Tenant from "../../models/rbac/Tenant.js";
import Membership from "../../models/rbac/Membership.js";

const router = express.Router();

function syncTenantParamToHeader(req, _res, next) {
  if (!req.headers["x-org-id"] && req.params.tenantId) {
    req.headers["x-org-id"] = req.params.tenantId;
  }
  next();
}

function validateTenantParam(req, res, next) {
  const { tenantId } = req.params;
  if (!mongoose.isValidObjectId(tenantId)) {
    return res.status(400).json({ message: "Invalid tenant id" });
  }
  next();
}

router.post("/", auth, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    const name = String(req.body?.name || "").trim();
    if (!name)
      return res.status(400).json({ message: "Tenant name is required" });

    const tenant = await Tenant.create({ name });

    const ownerRole = await Role.create({
      tenant: tenant._id,
      key: "owner",
      name: "Owner",
      permissions: Object.values(PERMS),
    });

    await Membership.create({
      tenantId: tenant._id,
      userId,
      roleId: ownerRole._id,
      roleKey: ownerRole.key,
      status: "active",
    });

    res.status(201).json({ data: { tenant } });
  } catch (err) {
    if (err?.name === "ValidationError")
      return res.status(400).json({ message: err.message });
    if (err?.code === 11000)
      return res
        .status(409)
        .json({ message: "Tenant already exists (duplicate slug/code)" });
    next(err);
  }
});

router.post(
  "/:tenantId/invites",
  auth,
  validateTenantParam, // ensures param is an ObjectId
  syncTenantParamToHeader, // still useful for tenantContext
  tenantContext, // membership + perm check
  requirePerm(PERMS.MEMBERS_INVITE),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId; // ✅ use the param you just validated
      const userId = req.auth.userId; // inviter
      const { email, roleId, roleKey } = req.body || {};
      if (!email) return res.status(400).json({ message: "email is required" });

      // resolve role by id or key, but ensure it belongs to THIS tenant
      let roleDoc = null;
      if (roleId) {
        if (!mongoose.isValidObjectId(roleId)) {
          return res.status(400).json({ message: "Invalid roleId" });
        }
        roleDoc = await Role.findById(roleId).lean();
        if (!roleDoc)
          return res.status(400).json({ message: "Role not found" });
        if (String(roleDoc.tenant) !== String(tenantId)) {
          return res.status(400).json({ message: "Role not in this tenant" });
        }
      } else if (roleKey) {
        roleDoc = await Role.findOne({
          tenant: tenantId,
          key: String(roleKey).trim(),
        }).lean();
        if (!roleDoc)
          return res
            .status(400)
            .json({ message: "Role not found for this tenant" });
      } else {
        return res
          .status(400)
          .json({ message: "roleId or roleKey is required" });
      }
      console.log("Invite payload", {
        tenantId: req.params.tenantId,
        email,
        roleId: roleDoc?._id?.toString(),
        roleKey: roleDoc?.key,
        invitedBy: req.auth.userId,
      });

      // 🔒 Write exactly what your schema requires
      const invite = await Invite.create({
        tenantId, // <-- was coming from req.auth; now from param
        email: String(email).toLowerCase().trim(),
        roleId: roleDoc._id,
        roleKey: roleDoc.key,
        invitedBy: userId,
        status: "pending", // code & expiresAt are auto-created by pre("validate")
      });

      return res.status(201).json({ data: { invite } });
    } catch (e) {
      if (e?.name === "ValidationError") {
        return res
          .status(400)
          .json({ message: `Invite validation failed: ${e.message}` });
      }
      if (e?.code === 11000) {
        return res.status(409).json({ message: "Duplicate invite code" });
      }
      next(e);
    }
  }
);

router.get(
  "/:tenantId/roles",
  auth,
  validateTenantParam,
  syncTenantParamToHeader,
  tenantContext,
  async (req, res, next) => {
    try {
      const items = await Role.find({ tenant: req.auth.tenantId }, "name key") // _id is included
        .sort({ name: 1 })
        .lean();
      res.json({ data: { items } });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
