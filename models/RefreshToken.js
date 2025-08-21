import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, index: true, unique: true },
    tokenHash: { type: String, required: true }, // store hash of raw token
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    revoked: { type: Boolean, default: false },
    replacedBy: { type: String, default: null }, // jti of replacement token
    expiresAt: { type: Date, required: true, index: true },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Ensure TTL index on expiresAt (Mongo will remove expired docs)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", RefreshTokenSchema);