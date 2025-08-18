import dotenv from "dotenv";
dotenv.config();

export const envVars = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  MONGO_URI: process.env.MONGO_URI,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",

  // Email / SMTP
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_FROM:
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    "ALTRUE <no-reply@altrue.test>",
};
