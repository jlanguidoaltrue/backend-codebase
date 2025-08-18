import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL = "http://localhost:3000/api/auth/oauth/google/callback",
  AUTH_SUCCESS_REDIRECT = "http://localhost:3001/oauth/callback",
  JWT_SECRET = "dev",
} = process.env;

const router = express.Router();
const oauth = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

// helper: sign your own access token
function signAccess(u) {
  return jwt.sign(
    {
      sub: u._id.toString(),
      isAdmin: !!u.isAdmin,
      isSuperadmin: !!u.isSuperadmin,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
}

// Start: create state, redirect to Google
router.get("/oauth/google", (req, res) => {
  const state = crypto.randomUUID();
  // store state in httpOnly cookie (5 min)
  res.cookie("g_state", state, {
    httpOnly: true,
    secure: false,
    maxAge: 5 * 60 * 1000,
    sameSite: "lax",
    path: "/",
  });

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
    state,
  });
  res.redirect(url);
});

// Callback: verify state, exchange code, verify id_token, upsert user, issue JWT, redirect to FE
router.get("/oauth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ error: "Missing code" });

    // CSRF/state check
    const cookieState = req.cookies?.g_state;
    if (!state || !cookieState || state !== cookieState) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }
    // clear state cookie
    res.clearCookie("g_state", { path: "/" });

    // Exchange authorization code for tokens
    const { tokens } = await oauth.getToken(code);
    // Prefer verifying the ID token (no extra HTTP call)
    const idToken = tokens.id_token;
    if (!idToken)
      return res.status(400).json({ error: "No id_token from Google" });

    const ticket = await oauth.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: "Bad Google token" });

    const email = (payload.email || "").toLowerCase();
    const googleId = payload.sub;
    const avatar = payload.picture || "";
    const name = payload.name || "";

    // Upsert/link local user
    let user = await User.findOne({
      "identities.provider": "google",
      "identities.providerId": googleId,
    });
    if (!user && email) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: email ? email.split("@")[0] : `google_${googleId}`,
        email: email || `${googleId}@google.local`,
        password: "SOCIAL_LOGIN", // placeholder; not used
        avatar,
        info: { name },
        identities: [{ provider: "google", providerId: googleId, email }],
      });
    } else {
      // ensure link + enrich profile (best effort)
      const has = (user.identities || []).some(
        (i) => i.provider === "google" && i.providerId === googleId
      );
      if (!has) {
        user.identities = user.identities || [];
        user.identities.push({
          provider: "google",
          providerId: googleId,
          email,
        });
      }
      if (!user.avatar && avatar) user.avatar = avatar;
      if (!user.info?.name && name) user.info = { ...(user.info || {}), name };
      await user.save();
    }

    // Issue YOUR JWT
    const token = signAccess(user);

    // Redirect back to frontend with token in URL fragment (not query)
    const target = new URL(AUTH_SUCCESS_REDIRECT);
    // #token=… keeps it out of server logs & referrers
    target.hash = `token=${encodeURIComponent(token)}`;
    res.redirect(target.toString());
  } catch (e) {
    console.error("Google OAuth callback error:", e?.message || e);
    res.redirect(`${AUTH_SUCCESS_REDIRECT}?err=oauth`);
  }
});

export default router;
