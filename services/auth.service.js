// src/services/auth.service.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const now = () => Date.now();

const maybeAutoUnlock = async (user) => {
  if (user.isLocked && user.lockUntil && now() > user.lockUntil.getTime()) {
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }
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

export const issueTokens = (user) => ({
  token: signAccessToken({ id: user._id, isAdmin: user.isAdmin }),
  refreshToken: signRefreshToken({ id: user._id }),
});

export const refreshAccessToken = (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const token = signAccessToken({ id: payload.id, isAdmin: payload.isAdmin });
  return { token };
};

export const registerUser = async ({ username, email, phone, password }) => {
  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) throw new AppError("Username or email already exists.", 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, phone, password: hashed });
  await user.save();
  return user;
};
