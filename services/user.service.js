import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return null;
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    to: user.email,
    subject: "Password Reset",
    text: `Reset link: http://localhost:3000/reset/${token}`,
  });
  return true;
}

export async function confirmPasswordReset(token, password) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: payload.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return false;
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return true;
  } catch {
    return false;
  }
}

export async function getProfile(userId) {
  return await User.findById(userId).select("-password");
}

export async function updateProfile(userId, { avatar, info, preferences }) {
  const user = await User.findById(userId);
  if (avatar) user.avatar = avatar;
  if (info) user.info = info;
  if (preferences) user.preferences = preferences;
  await user.save();
  return true;
}

export async function changeAccount(userId, { email, username }) {
  const user = await User.findById(userId);
  if (email) user.email = email;
  if (username) user.username = username;
  await user.save();
  return true;
}

export async function setupTotp(userId) {
  const secret = speakeasy.generateSecret({ name: `App (${userId})` });
  const user = await User.findById(userId);
  user.mfa.enabled = true;
  user.mfa.type = "totp";
  user.mfa.secret = secret.base32;
  await user.save();
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  return { qr, secret: secret.base32 };
}

export async function verifyTotp(userId, token) {
  const user = await User.findById(userId);
  return speakeasy.totp.verify({
    secret: user.mfa.secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export async function setupEmail2FA(userId) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await User.findById(userId);
  user.mfa.enabled = true;
  user.mfa.type = "email";
  user.mfa.secret = code;
  await user.save();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    to: user.email,
    subject: "Your 2FA Code",
    text: `Your code: ${code}`,
  });
  return true;
}

export async function verifyEmail2FA(userId, code) {
  const user = await User.findById(userId);
  console.log("Verifying Email 2FA:");
  console.log("Stored code:", user.mfa.secret);
  console.log("Received code:", code);
  return user.mfa.secret === code;
}

export async function setupSMS2FA(userId) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await User.findById(userId);
  user.mfa.enabled = true;
  user.mfa.type = "sms";
  user.mfa.secret = code;
  await user.save();

  console.log("Generated SMS code:", code);

  // TODO: Integrate with actual SMS provider (e.g., Twilio)
  // For now, just log the code to console so you can test
  console.log(`SMS Code for ${user.phone}: ${code}`);

  return true;
}
export async function verifySMS2FA(userId, code) {
  const user = await User.findById(userId);
  console.log("Verifying SMS 2FA:");
  console.log("Stored code:", user.mfa.secret);
  console.log("Received code:", code);
  return user.mfa.secret === code;
}
