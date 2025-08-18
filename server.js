import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { envVars } from "./config/envVars.js";

const server = http.createServer(app);
server.listen(envVars.PORT, () => {
  console.log(`Server running on port ${envVars.PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
