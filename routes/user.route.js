import express from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  requestPasswordReset,
  confirmPasswordReset,
  getProfile,
  updateProfile,
  changeAccount,
  setupTotp,
  verifyTotp,
  setupEmail2FA,
  verifyEmail2FA,
  setupSMS2FA,
  verifySMS2FA,
} from "../services/user.service.js";
import { toSafeUser } from "../utils/userMapper.util.js";

const router = express.Router();

// Consistent way to read the authenticated user id from JWT
const getUid = (req) => req.user?.sub || req.user?.id || req.user?._id;

/* ------------------------------ Password reset ------------------------------ */

router.post("/reset-password", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });

  const ok = await requestPasswordReset(email);
  if (!ok) return res.status(404).json({ message: "User not found." });
  res.json({ message: "Reset email sent." });
});

router.post("/reset/:token", async (req, res) => {
  const token = String(req.params.token || "");
  const password = String(req.body?.password || "");
  if (!token || !password)
    return res
      .status(400)
      .json({ message: "Token and password are required." });

  const ok = await confirmPasswordReset(token, password);
  if (!ok)
    return res.status(400).json({ message: "Invalid or expired token." });
  res.json({ message: "Password reset successful." });
});

/* ------------------------------- Profile CRUD ------------------------------- */

router.get("/profile", auth, async (req, res) => {
  const userId = getUid(req);
  const user = await getProfile(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ data: { user: toSafeUser(user) } });
});

router.patch("/profile", auth, async (req, res) => {
  const userId = getUid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Accept only the editable fields from the client
  const { name, username, avatarUrl, preferences, phone } = req.body || {};

  // Translate UI fields -> storage shape
  const update = {};
  if (typeof username === "string" && username.trim())
    update.username = username.trim();
  if (typeof phone === "string") update.phone = phone.trim();
  if (avatarUrl !== undefined) update.avatar = String(avatarUrl || ""); // UI avatarUrl -> DB avatar
  if (preferences !== undefined) update.preferences = preferences;
  if (name !== undefined) update["info.name"] = String(name || ""); // store under info.name

  if (Object.keys(update).length === 0)
    return res.status(400).json({ error: "No valid fields to update" });

  // ✅ Use your service to persist; it should return the updated doc
  const updated = await updateProfile(userId, update);
  if (!updated) return res.status(404).json({ error: "User not found" });

  res.json({ data: { user: toSafeUser(updated) } });
});

/* --------------------------- Account email/username -------------------------- */

router.put("/change", auth, async (req, res) => {
  const userId = getUid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  await changeAccount(userId, req.body || {});
  res.json({ message: "Account updated." });
});

/* ---------------------------------- MFA TOTP -------------------------------- */

router.post("/mfa/setup/totp", auth, async (req, res) => {
  const result = await setupTotp(getUid(req));
  res.json(result);
});

router.post("/mfa/verify/totp", auth, async (req, res) => {
  const token = String(req.body?.token || "");
  if (!token) return res.status(400).json({ message: "Token required" });

  const ok = await verifyTotp(getUid(req), token);
  return ok
    ? res.json({ message: "2FA verified." })
    : res.status(400).json({ message: "Invalid 2FA token." });
});

/* ---------------------------------- MFA Email ------------------------------- */

router.post("/mfa/setup/email", auth, async (req, res) => {
  await setupEmail2FA(getUid(req));
  res.json({ message: "2FA code sent to email." });
});

router.post("/mfa/verify/email", auth, async (req, res) => {
  const code = String(req.body?.code || "");
  if (!code) return res.status(400).json({ message: "Code required" });

  const ok = await verifyEmail2FA(getUid(req), code);
  return ok
    ? res.json({ message: "2FA verified." })
    : res.status(400).json({ message: "Invalid 2FA code." });
});

/* ----------------------------------- MFA SMS -------------------------------- */

router.post("/mfa/setup/sms", auth, async (req, res) => {
  await setupSMS2FA(getUid(req));
  res.json({ message: "2FA code sent via SMS (mock)." });
});

router.post("/mfa/verify/sms", auth, async (req, res) => {
  const code = String(req.body?.code || "");
  if (!code) return res.status(400).json({ message: "Code required" });

  const ok = await verifySMS2FA(getUid(req), code);
  return ok
    ? res.json({ message: "2FA verified." })
    : res.status(400).json({ message: "Invalid 2FA code." });
});

export default router;
