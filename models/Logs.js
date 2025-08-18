import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    url: String,
    method: String,
    status: Number,
    message: String,
    stack: String,
    userId: String,
    ip: String,
    meta: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Log", LogSchema);
