import { Router } from "express";
import admin from "./admin/admin.route.js";
import auth from "./auth/auth.route.js";
import oauth from "./auth/oauth.route.js";
import invites from "./tenants/invites.route.js";
import me from "./member/me.route.js";
import tenants from "./tenants/tenant.routes.js";

const router = Router();

router.use("/admin", admin);
router.use("/auth", auth);
router.use("/auth/oauth", oauth);
router.use("/invites", invites);
router.use("/me", me);
router.use("/tenants", tenants);

export default router;
