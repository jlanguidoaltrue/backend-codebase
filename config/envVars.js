import dotenv from "dotenv";
dotenv.config();

export const envVars = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/appdb",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Email / SMTP
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_FROM:
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    "no-reply@example.com",

  // JWT secrets (support legacy JWT_SECRET)
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "access-secret",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "refresh-secret",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES_DAYS: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),

  // KMS / encryption key (AES-256 key, base64 or hex)
  FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY || "",

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_FROM: process.env.TWILIO_FROM || "",

  // Sentry / monitoring (optional)
  SENTRY_DSN: process.env.SENTRY_DSN || "",
};
