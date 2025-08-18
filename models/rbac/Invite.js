import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    roleKey: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

InviteSchema.index({ code: 1 }, { unique: true });
export default mongoose.model("Invite", InviteSchema);
