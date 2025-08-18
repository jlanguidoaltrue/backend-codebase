import mongoose from "mongoose";

const MembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },
    roleKey: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "invited", "disabled"],
      default: "active",
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
export default mongoose.model("Membership", MembershipSchema);
