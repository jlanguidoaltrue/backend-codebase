import Log from "../models/Logs.js";
import asyncHandler from "express-async-handler";

export const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Log.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Log.countDocuments(),
  ]);

  res.json({ data: { logs: items, page, total } });
});
