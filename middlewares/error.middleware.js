import path from "path";
import fs from "fs/promises";
import Log from "../models/Logs.js";
import { envVars } from "../config/envVars.js";
import { transporter } from "../utils/mailer.js";

const LOG_FILE = path.resolve("error.log");

// eslint-disable-next-line no-unused-vars
export const errorHandler = async (err, req, res, _next) => {
  const status = err.status || 500;

  const entry = {
    url: req.originalUrl,
    method: req.method,
    status,
    message: err.message,
    stack: err.stack,
    userId: req.user?.sub || req.user?.id,
    ip: req.ip,
    createdAt: new Date(),
  };

  // Console log (except tests)
  if (envVars.NODE_ENV !== "test") {
    console.error("API Error:", entry);
  }

  // Persist to Mongo
  try {
    await Log.create(entry);
  } catch {}

  // Append to file
  try {
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {}

  // Send email
  try {
    await transporter.sendMail({
      to: envVars.EMAIL_USER || "alerts@altrue.test",
      from: envVars.SMTP_FROM,
      subject: `[ALTRUE] ${status} ${req.method} ${req.originalUrl}`,
      html: `
        <h3>Server Error ${status}</h3>
        <p><b>${req.method}</b> ${req.originalUrl}</p>
        <pre>${entry.message}</pre>
        <pre style="white-space:pre-wrap">${entry.stack || ""}</pre>
      `,
    });
  } catch (emailErr) {
    console.error("Error sending error email:", emailErr?.message || emailErr);
  }

  if (!res.headersSent) {
    res.status(status).json({ error: err.message || "Server error" });
  }
};
