import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import LogsUtils from "../utils/logs.utils";
import { initializeCronJobs } from "./index";

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV ? `${process.env.NODE_ENV}.env` : ".env";
const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

async function startCronRunner() {
  try {
    LogsUtils.logMessage("Starting cron job runner");

    // Initialize cron jobs
    initializeCronJobs();

    // Keep the process running
    process.on("SIGINT", () => {
      LogsUtils.logMessage("Cron runner received SIGINT signal");
      LogsUtils.closeStreams();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      LogsUtils.logMessage("Cron runner received SIGTERM signal");
      LogsUtils.closeStreams();
      process.exit(0);
    });

    LogsUtils.logMessage("Cron job runner successfully started");
  } catch (error) {
    LogsUtils.logError("Failed to start cron job runner", error as Error);
    LogsUtils.closeStreams();
    process.exit(1);
  }
}

// Start the cron runner
startCronRunner();
