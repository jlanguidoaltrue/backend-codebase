import express from "express";
import fs from "fs";
import path from "path";
import auth from "../middlewares/auth.middleware.js";
import { listLogs } from "../controllers/admin.controller.js";
import { tenantContext } from "../middlewares/tenantContext.middleware.js";

const router = express.Router();

// Simple error log file path (customize as needed)
const LOG_FILE = path.resolve("error.log");

router.get(
  "/logs",
  auth,
  tenantContext, // attaches req.auth (superadmin bypass)
  requireSystemPerm(), // superadmin only
  listLogs
);

router.post(
  "/tenants/:tenantId/invites",
  auth,
  tenantContext,
  requirePerm(PERMS.MEMBERS_INVITE),
  async (req, res, next) => {
    try {
      if (req.params.tenantId !== req.auth.tenantId)
        return res.status(400).json({ message: "Tenant mismatch" });

      const { email, roleId } = req.body;
      const role = await Role.findOne({
        _id: roleId,
        tenant: req.auth.tenantId,
      });
      if (!role) return res.status(400).json({ message: "Invalid role" });

      const invite = await Invite.create({
        tenant: req.auth.tenantId,
        email: String(email).toLowerCase().trim(),
        role: role._id,
        invitedBy: req.auth.userId,
      });
      res.json({ data: { invite } });
    } catch (e) {
      next(e);
    }
  }
);

// Mock error throw
router.get("/throw", (_req, _res) => {
  const e = new Error("Intentional 500 test error");
  e.status = 500;
  throw e;
});

router.get("/throw/:status", (req, _res) => {
  const n = Number(req.params.status);
  const status = Number.isFinite(n) && n >= 100 && n <= 599 ? n : 500;
  const e = new Error(`Intentional ${status} test error`);
  e.status = status;
  throw e;
});
export default router;
