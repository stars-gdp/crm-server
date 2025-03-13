import { CronJob } from "cron";
import axios from "axios";
import LogsUtils from "../utils/logs.utils";
import EnvConfig from "../config/env.config";

// Base URL for the API endpoints
const API_BASE_URL = `http://localhost:${EnvConfig.PORT}/api`;

/**
 * Send a request to a follow-up API endpoint
 * @param endpoint The follow-up endpoint to call
 */
async function triggerFollowUp(endpoint: string): Promise<void> {
  try {
    LogsUtils.logMessage(`Triggering follow-up endpoint: ${endpoint}`);
    const response = await axios.post(`${API_BASE_URL}/follow-up/${endpoint}`);
    LogsUtils.logMessage(
      `Follow-up endpoint response: ${JSON.stringify(response.data)}`,
    );
  } catch (error) {
    LogsUtils.logError(
      `Failed to trigger follow-up endpoint: ${endpoint}`,
      error as Error,
    );
  }
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  LogsUtils.logMessage("Initializing cron jobs for follow-ups");

  // First follow-up (fu1) at 14:00 UTC daily
  // Syntax: '0 minute hour day-of-month month day-of-week'
  const fu1Job = new CronJob(
    "0 14 * * *",
    () => {
      triggerFollowUp("send-fu1");
    },
    null,
    true,
    "UTC",
  );

  // Second follow-up (fu2) at 09:00 UTC daily
  const fu2Job = new CronJob(
    "0 9 * * *",
    () => {
      triggerFollowUp("send-fu2");
    },
    null,
    true,
    "UTC",
  );

  // 15-minute reminder at 10:45 UTC daily
  const reminderJob = new CronJob(
    "45 10 * * *",
    () => {
      triggerFollowUp("send-15min-reminder");
    },
    null,
    true,
    "UTC",
  );

  // Start all jobs
  fu1Job.start();
  fu2Job.start();
  reminderJob.start();

  LogsUtils.logMessage("All cron jobs started successfully");
}
