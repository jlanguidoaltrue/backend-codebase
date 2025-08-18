import nodemailer from "nodemailer";
import { envVars } from "../config/envVars.js";

export const transporter =
  envVars.EMAIL_USER && envVars.EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: envVars.EMAIL_USER, pass: envVars.EMAIL_PASS },
      })
    : nodemailer.createTransport({
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        secure: false,
      });
