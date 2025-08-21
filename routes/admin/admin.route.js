import express from "express";
import auth from "../../middlewares/auth.middleware.js";
import { requireSystemPerm } from "../../middlewares/permit.middleware.js";
import { listLogs } from "../../controllers/admin.controller.js";

const router = express.Router();

router.get("/logs", auth, requireSystemPerm(), listLogs);

export default router;
