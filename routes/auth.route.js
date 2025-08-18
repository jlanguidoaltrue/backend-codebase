import { Router } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { validate } from "../middlewares/validateJoi.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../schemas/auth.schema.js";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/auth.controller.js";

const router = Router();

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

router.post("/login", loginRateLimitMw, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/register", validate(registerSchema), register);

export default router;
