import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { envVars } from "./config/envVars.js";
import { connectDb } from "./config/db.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import oauthRoutes from "./routes/oauth.routes.js";

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

//Passport / OAuth routes
const passport = initPassport();
app.use(passport.initialize());
app.use("/api/auth/oauth", oauthRoutes);

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// App routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth/oauth", oauthRoutes);

// Root
app.get("/", (_req, res) => res.send("API is running"));

// centralized error handler
app.use(notFound);
app.use(errorHandler);

export default app;
