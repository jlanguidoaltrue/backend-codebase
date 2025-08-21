import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import AppError from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { envVars } from "../config/envVars.js";

const now = () => Date.now();

const maybeAutoUnlock = async (user) => {
  if (user.isLocked && user.lockUntil && now() > user.lockUntil.getTime()) {
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }
};

export const findUserByUsernameOrEmail = async (uOrE) => {
  if (!uOrE) return null;
  const needle = String(uOrE).trim();
  return User.findOne({
    $or: [{ username: needle }, { email: needle.toLowerCase() }],
  });
};
export const findUserByUsername = async (username) =>
  User.findOne({ username });

export const assertAccountUsable = async (user) => {
  if (!user) throw new AppError("Invalid credentials.", 401);

  await maybeAutoUnlock(user);
  if (user.isLocked)
    throw new AppError("Account locked. Try again later.", 401);
};

export const verifyPasswordOrLock = async (user, password) => {
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockUntil = new Date(now() + 30 * 60 * 1000); // 30 mins
    }
    await user.save();
    throw new AppError("Invalid credentials.", 401);
  }
  // success
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockUntil = undefined;
  await user.save();
};

// create access token + refresh token and persist refresh token in DB
export const issueTokens = async (user, meta = {}) => {
  const access = signAccessToken({ id: user._id, isAdmin: user.isAdmin });
  const { token: refreshToken, jti } = signRefreshToken({ id: user._id, isAdmin: user.isAdmin });

  // store a hash of refresh token; so raw token isn't stored
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + envVars.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    jti,
    tokenHash,
    userId: user._id,
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { token: access, refreshToken };
};

// rotate refresh token: verify incoming refresh token, ensure DB record exists and not revoked,
// then create a new refresh token, mark old token as revoked/replaced and persist new record.
export const refreshAccessToken = async (incomingRefreshToken, meta = {}) => {
  // verify signature and read payload
  const payload = verifyRefreshToken(incomingRefreshToken);
  const jti = payload.jti || payload.jti || payload.jti; // ensure jti
  if (!jti) throw new AppError("Invalid refresh token.", 401);

  // find DB record
  const tokenHash = crypto.createHash("sha256").update(incomingRefreshToken).digest("hex");
  const existing = await RefreshToken.findOne({ jti, tokenHash });

  if (!existing || existing.revoked) {
    // possible token reuse -> revoke all user's tokens
    if (existing && existing.revoked) {
      await RefreshToken.updateMany({ userId: existing.userId }, { revoked: true });
    }
    throw new AppError("Refresh token invalid or expired.", 401);
  }

  // create new tokens
  const user = await User.findById(existing.userId);
  if (!user) throw new AppError("User not found.", 404);

  // create replacement refresh token and persist
  const access = signAccessToken({ id: user._id, isAdmin: user.isAdmin });
  const { token: newRefreshToken, jti: newJti } = signRefreshToken({ id: user._id, isAdmin: user.isAdmin });
  const newTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + envVars.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  // mark old as revoked and replacedBy
  existing.revoked = true;
  existing.replacedBy = newJti;
  await existing.save();

  await RefreshToken.create({
    jti: newJti,
    tokenHash: newTokenHash,
    userId: user._id,
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { token: access, refreshToken: newRefreshToken };
};

export const logout = async (userId, incomingRefreshToken) => {
  try {
    if (incomingRefreshToken) {
      const tokenHash = crypto.createHash("sha256").update(incomingRefreshToken).digest("hex");
      await RefreshToken.findOneAndUpdate({ tokenHash, userId }, { revoked: true });
    } else {
      // revoke all user's refresh tokens
      await RefreshToken.updateMany({ userId }, { revoked: true });
    }
    return true;
  } catch (e) {
    // swallow and return false for logout failures
    return false;
  }
};

export const registerUser = async ({ username, email, phone, password }) => {
  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) throw new AppError("Username or email already exists.", 409);

  const user = new User({ username, email, phone, password });
  await user.save();
  return user;
};
