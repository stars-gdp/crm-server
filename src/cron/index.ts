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

  // Second follow-up (fu2) at 08:00 UTC daily
  const fu2Job = new CronJob(
    "0 8 * * *",
    () => {
      triggerFollowUp("send-fu2");
    },
    null,
    true,
    "UTC",
  );

  // For Sunday meetings (09:30 UTC)
  const sundayReminderJob = new CronJob(
    "30 9 * * 0", // 09:30 UTC on Sundays (0 = Sunday)
    () => {
      triggerFollowUp("send-15min-reminder");
    },
    null,
    true,
    "UTC",
  );

  // For Monday-Saturday meetings (10:30 UTC)
  const weekdayReminderJob = new CronJob(
    "30 10 * * 1-6", // 10:30 UTC Monday-Saturday (1-6)
    () => {
      triggerFollowUp("send-15min-reminder");
    },
    null,
    true,
    "UTC",
  );

  // For Sunday meetings (09:30 UTC)
  const sundayNotReadyJob = new CronJob(
    "50 9 * * 0", // 09:30 UTC on Sundays (0 = Sunday)
    () => {
      triggerFollowUp("send-not-ready-bom");
    },
    null,
    true,
    "UTC",
  );

  // For Monday-Saturday meetings (10:30 UTC)
  const weekdayNotReadyJob = new CronJob(
    "50 10 * * 1-6", // 10:30 UTC Monday-Saturday (1-6)
    () => {
      triggerFollowUp("send-not-ready-bom");
    },
    null,
    true,
    "UTC",
  );

  // For Sunday meetings (09:30 UTC)
  const sundayNoCodeJob = new CronJob(
    "0 11 * * 0", // 09:30 UTC on Sundays (0 = Sunday)
    () => {
      triggerFollowUp("send-no-code-bom");
    },
    null,
    true,
    "UTC",
  );

  // For Monday-Saturday meetings (10:30 UTC)
  const weekdayNoCodeJob = new CronJob(
    "0 12 * * 1-6", // 10:30 UTC Monday-Saturday (1-6)
    () => {
      triggerFollowUp("send-no-code-bom");
    },
    null,
    true,
    "UTC",
  );

  // BIT follow-up (fu_bit_1) at 13:00 UTC on Saturdays
  const fuBitJob = new CronJob(
    "0 13 * * 6", // 13:00 UTC on Saturdays (6 = Saturday)
    () => {
      triggerFollowUp("send-fu-bit1");
    },
    null,
    true,
    "UTC",
  );

  // Second BIT follow-up (fu_bit_2) at 8:00 UTC on Sundays (day of BIT meeting)
  const fuBit2Job = new CronJob(
    "0 10 * * 0", // 10:00 UTC on Sundays (0 = Sunday)
    () => {
      triggerFollowUp("send-fu-bit2");
    },
    null,
    true,
    "UTC",
  );

  // Start all jobs
  fu1Job.start();
  fu2Job.start();
  weekdayReminderJob.start();
  sundayReminderJob.start();
  weekdayNotReadyJob.start();
  sundayNotReadyJob.start();
  sundayNoCodeJob.start();
  weekdayNoCodeJob.start();
  fuBitJob.start();
  fuBit2Job.start();

  LogsUtils.logMessage("All cron jobs started successfully");
}
