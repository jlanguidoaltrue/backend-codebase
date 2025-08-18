import mongoose from "mongoose";
import { envVars } from "./envVars.js";

export const connectDb = async () => {
  if (!envVars.MONGO_URI) throw new Error("MONGO_URI is not set");

  try {
    await mongoose.connect(envVars.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
