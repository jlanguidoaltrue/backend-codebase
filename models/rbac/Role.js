import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    key: { type: String, required: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

RoleSchema.index({ tenant: 1, key: 1 }, { unique: true });

export default mongoose.model("Role", RoleSchema);
