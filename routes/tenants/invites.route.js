import express from "express";
import auth from "../../middlewares/auth.middleware.js";
import Invite from "../../models/rbac/Invite.js";
import Membership from "../../models/rbac/Membership.js";

const router = express.Router();

router.post("/:token/accept", auth, async (req, res, next) => {
  try {
    const inv = await Invite.findOne({
      token: req.params.token,
      status: "pending",
    });
    if (!inv) return res.status(400).json({ message: "Invalid invite" });

    const role = await Role.findById(inv.role).lean();
    if (!role)
      return res.status(400).json({ message: "Invite role no longer exists" });

    const userId = req.user.id || req.user.sub;

    await Membership.findOneAndUpdate(
      { userId, tenantId: inv.tenant },
      { $set: { roleId: role._id, roleKey: role.key, status: "active" } },
      { upsert: true, new: true }
    );

    inv.status = "accepted";
    await inv.save();

    res.json({ message: "Joined tenant." });
  } catch (e) {
    next(e);
  }
});

export default router;
