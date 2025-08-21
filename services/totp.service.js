import speakeasy from "speakeasy";
import qrcode from "qrcode";

/**
 * generateTotpSecret(userLabel) -> { ascii, hex, base32, otpauth_url, qrDataUrl }
 * verifyTotp(token, secret)
 * createBackupCodes() -> array of codes (hash/store in user)
 */

export const generateTotpSecret = async (userLabel) => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: userLabel,
    issuer: process.env.TOTP_ISSUER || "App",
  });

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
    qrDataUrl,
  };
};

export const verifyTotp = (token, base32Secret) => {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token,
    window: 1, // allow +/-1 window
  });
};

export const createBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = Math.random().toString(36).slice(2, 10).toUpperCase();
    codes.push(raw);
  }
  return codes;
};