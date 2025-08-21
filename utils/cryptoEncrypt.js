import crypto from "crypto";
import { envVars } from "../config/envVars.js";

/**
 * AES-256-GCM helper. If FIELD_ENCRYPTION_KEY is not configured, functions return plaintext.
 * KEY must be 32 bytes (base64 or hex). We accept raw string and derive via SHA256.
 */

const getKey = () => {
  if (!envVars.FIELD_ENCRYPTION_KEY) return null;
  // Derive 32-byte key from provided string
  return crypto.createHash("sha256").update(envVars.FIELD_ENCRYPTION_KEY).digest();
};

export const encryptField = (plaintext) => {
  const key = getKey();
  if (!key) return { ciphertext: plaintext, iv: null, tag: null, alg: "none" };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    alg: "aes-256-gcm",
  };
};

export const decryptField = (obj) => {
  if (!obj || obj.alg === "none") return obj ? obj.ciphertext : null;
  const key = getKey();
  if (!key) return obj.ciphertext;
  const iv = Buffer.from(obj.iv, "base64");
  const tag = Buffer.from(obj.tag, "base64");
  const ct = Buffer.from(obj.ciphertext, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
};