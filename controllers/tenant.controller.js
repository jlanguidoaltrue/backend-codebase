import Tenant from "../models/rbac/Tenant.js";
import asyncHandler from "express-async-handler";

export const createTenant = asyncHandler(async (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ message: "name and slug are required" });
  }

  const exists = await Tenant.findOne({ slug });
  if (exists) {
    return res.status(409).json({ message: "Slug already exists" });
  }

  const tenant = await Tenant.create({ name, slug });
  res.status(201).json({ data: tenant });
});
