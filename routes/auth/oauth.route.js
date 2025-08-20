import { Router } from "express";
import { oauthConfig } from "../../config/oauth.config.js";
import { issueJWT } from "../../utils/jwt.js";
import passport from "passport";
import { randomBytes } from "node:crypto";
const router = Router();

// Start auth
if (oauthConfig.google.clientID) {
  router.get("/google", (req, res, next) => {
    const prompt = req.query.prompt || "select_account";
    const state = randomBytes(8).toString("hex");
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      prompt,
      state,
    })(req, res, next);
  });
}

if (oauthConfig.microsoft.clientID) {
  router.get(
    "/microsoft",
    passport.authenticate("microsoft", { session: false })
  );
}

if (oauthConfig.apple.clientID) {
  router.get(
    "/apple",
    passport.authenticate("apple", { scope: ["name", "email"], session: false })
  );
}

// Callback -> issue JWT -> redirect to FE
const successRedirect = (req, res) => {
  const token = issueJWT(req.user);
  return res.redirect(
    `${oauthConfig.successRedirect}#token=${encodeURIComponent(token)}`
  );
};

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  successRedirect
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  successRedirect
);

router.post(
  "/apple/callback",
  passport.authenticate("apple", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  successRedirect
);

router.get("/failure", (_req, res) => {
  res.status(401).json({ error: "OAuth failed" });
});

export default router;
