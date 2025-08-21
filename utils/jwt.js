import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { envVars } from "../config/envVars.js";

export const signAccessToken = (payload) => {
  return jwt.sign(
    { ...payload },
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: envVars.JWT_ACCESS_EXPIRES, jwtid: randomUUID() }
  );
};

// Refresh tokens are long lived and are stored in DB (rotation + revocation support)
export const signRefreshToken = (payload, opts = {}) => {
  // include jti in token for DB correlation
  const jti = opts.jti || randomUUID();
  const token = jwt.sign(
    { ...payload, jti },
    envVars.JWT_REFRESH_SECRET,
    { expiresIn: `${envVars.JWT_REFRESH_EXPIRES_DAYS}d`, jwtid: jti }
  );
  return { token, jti };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, envVars.JWT_ACCESS_SECRET);
  } catch (e) {
    const err = new Error("Invalid access token");
    err.status = 401;
    throw err;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, envVars.JWT_REFRESH_SECRET);
  } catch (e) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }
};
/**
 * Backwards-compatible helper used by older oauth routes.
 * Returns { token, refreshToken, jti } where token = access token.
 * Use issueTokens (service) when DB-backed refresh rotation is required.
 */
export const issueJWT = (user, opts = {}) => {
  const payload = {
    id: user._id ?? user.id,
    isAdmin: user.isAdmin ?? false,
    ...opts.claims,
  };

  const token = signAccessToken(payload);
  const { token: refreshToken, jti } = signRefreshToken(payload, { jti: opts.jti });

  return { token, refreshToken, jti };
};
