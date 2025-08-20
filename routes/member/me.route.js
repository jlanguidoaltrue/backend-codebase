import express from "express";
import auth from "../../middlewares/auth.middleware.js";
import Membership from "../../models/rbac/Membership.js";

const router = express.Router();

router.get("/memberships", auth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const items = await Membership.find({ userId })
      .populate({ path: "tenantId", model: "Tenant", select: "name slug" })
      .populate({
        path: "roleId",
        model: "Role",
        select: "name key permissions",
      })
      .lean();

    res.json({ data: { items } });
  } catch (e) {
    next(e);
  }
});
export default router;
