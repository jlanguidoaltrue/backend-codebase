import Twilio from "twilio";
import { envVars } from "../config/envVars.js";
import AppError from "../utils/AppError.js";

const client = envVars.TWILIO_ACCOUNT_SID
  ? Twilio(envVars.TWILIO_ACCOUNT_SID, envVars.TWILIO_AUTH_TOKEN)
  : null;

export const sendSMS = async ({ to, body }) => {
  if (!client) {
    throw new AppError("Twilio not configured", 500);
  }
  try {
    const msg = await client.messages.create({
      body,
      from: envVars.TWILIO_FROM,
      to,
    });
    return msg;
  } catch (e) {
    throw new AppError("Failed to send SMS", 500);
  }
};