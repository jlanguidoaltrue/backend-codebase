import mongoose from "mongoose";
import { randomBytes } from "node:crypto";

const InviteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    roleKey: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// generate missing bits automatically
InviteSchema.pre("validate", function (next) {
  if (!this.code) this.code = randomBytes(16).toString("hex");
  if (!this.expiresAt)
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  next();
});

// auto-clean expired invites (Mongo TTL)
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Invite || mongoose.model("Invite", InviteSchema);
