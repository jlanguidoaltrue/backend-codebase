import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { envVars } from "./config/envVars.js";
import { connectDb } from "./config/db.js";

import apiRoutes from "./routes/index.js";

import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { initPassport } from "./passport/index.js";

const app = express();

connectDb();

// Core middlewares
app.use(helmet());
app.use(
  cors({
    origin: envVars.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (envVars.NODE_ENV !== "production") app.use(morgan("dev"));

//Passport initialization
const passport = initPassport();
app.use(passport.initialize());

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api", apiRoutes);

// Root
app.get("/", (_req, res) => res.send("API is running"));

// centralized error handler
app.use(notFound);
app.use(errorHandler);

export default app;
