// src/utils/jwt.js
import jwt from "jsonwebtoken";
import AppError from "./AppError.js";

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES = "15m",
  JWT_REFRESH_EXPIRES = "7d",
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.warn(
    "[JWT] Missing JWT_ACCESS_SECRET and/or JWT_REFRESH_SECRET – set them in your .env"
  );
}

export function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
    ...opts,
  });
}

export function signRefreshToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
    ...opts,
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, { clockTolerance: 5 });
  } catch {
    throw new AppError("Invalid or expired access token.", 401);
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { clockTolerance: 5 });
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }
}
export function issueTokenPair(user) {
  const payload = {
    sub: user._id?.toString?.() || String(user.sub || user.id),
    role: user.role || (user.isAdmin ? "admin" : "user"),
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: payload.sub }),
  };
}

export function issueJWT(user) {
  const payload = {
    sub: user._id?.toString?.() || String(user.sub || user.id),
    role: user.role || (user.isAdmin ? "admin" : "user"),
  };
  return signAccessToken(payload);
}

export function getBearerToken(req) {
  const h = req.headers?.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}
