import fs from "fs/promises";
import path from "path";
import Log from "../models/Logs.js";
import { sendMail } from "./email.service.js";

const LOG_FILE = path.resolve("error.log");

/**
 * Persist the error and optionally notify by email.
 * Safe: never throws.
 */
export async function recordError({ err, req, status }) {
  try {
    const entry = {
      url: req?.originalUrl,
      method: req?.method,
      status: status || 500,
      message: err?.message || "Error",
      stack: err?.stack,
      userId: req?.user?.sub || req?.user?.id,
      ip: req?.ip,
      meta: {
        headers: {
          referer: req?.headers?.referer,
          origin: req?.headers?.origin,
          "user-agent": req?.headers?.["user-agent"],
        },
        body: req?.body,
        query: req?.query,
      },
    };

    // 1) DB
    await Log.create(entry).catch(() => {});

    // 2) File (JSONL)
    try {
      await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
    } catch {}

    // 3) Email only for 5xx
    if ((status || 500) >= 500) {
      try {
        const html = `
          <h3>Server Error (${status || 500})</h3>
          <p><b>${entry.method}</b> ${entry.url}</p>
          <pre>${entry.message}</pre>
          <pre style="white-space:pre-wrap">${entry.stack || ""}</pre>
        `;
        // change address if you like
        await sendMail(
          "alerts@altrue.test",
          `ALTRUE Error ${status || 500}`,
          html
        );
      } catch {}
    }
  } catch {
    // swallow all logging errors
  }
}
