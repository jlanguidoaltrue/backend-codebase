import express from "express";
import * as authCtrl from "../../controllers/auth.controller.js";
import auth from "../../middlewares/auth.middleware.js";
import { requireSystemPerm } from "../../middlewares/permit.middleware.js";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { validate } from "../../middlewares/validateJoi.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../../schemas/auth.schema.js";

const router = express.Router();

const loginLimiter = new RateLimiterMemory({
  points: 10,
  duration: 15 * 60, // per 15 minutes
});

const loginRateLimitMw = async (req, res, next) => {
  try {
    const key = req.ip; // or `${req.ip}:${req.body.email}`
    await loginLimiter.consume(key);
    next();
  } catch {
    res
      .status(429)
      .json({ message: "Too many login attempts, please try again later." });
  }
};

// Public
router.post("/login", loginRateLimitMw, validate(loginSchema), authCtrl.login);
router.post("/refresh", validate(refreshSchema), authCtrl.refresh);
router.post("/forgot", authCtrl.forgotPassword);
router.post("/reset", authCtrl.resetPassword);

// Protected (admin only for registration)
router.post(
  "/register",
  auth,
  requireSystemPerm("user.create"),
  validate(registerSchema),
  authCtrl.register
);

// Protected user actions
router.post("/logout", auth, authCtrl.doLogout);
router.post("/mfa/enroll", auth, authCtrl.mfaEnroll);
router.post("/mfa/verify", auth, authCtrl.mfaVerify);

export default router;
