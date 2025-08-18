import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    name: { type: String, required: true },
    key: { type: String, required: true },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: { tenantId: 1, key: 1 } }],
  }
);

export default mongoose.model("Role", RoleSchema);
