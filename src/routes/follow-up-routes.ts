import { Router, Request, Response } from "express";
import { LeadRepository } from "../repositories/lead.repository";
import LogsUtils from "../utils/logs.utils";
import LeadsUtils from "../utils/leads.utils";
import { ITemplateParameter } from "../typescript/interfaces";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const router = Router();
const leadRepository = new LeadRepository();

// Constants
const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Helper function to format a date in IST timezone with the specified format
 * @param date Date to format
 * @param format Format string (dayjs format)
 * @returns Formatted date string in IST timezone
 */
function formatDateInIST(
  date: Date,
  format: string = "DD.MM.YY, HH:mm",
): string {
  return dayjs(date).tz(IST_TIMEZONE).format(format);
}

/**
 * Helper function to check if a date is today
 * @param date Date to check
 * @returns Boolean indicating if the date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(today.getHours() + 5);
  today.setMinutes(today.getMinutes() + 30);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Helper function to check if a date is tomorrow
 * @param date Date to check
 * @returns Boolean indicating if the date is tomorrow
 */
function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(tomorrow.getHours() + 5);
  tomorrow.setMinutes(tomorrow.getMinutes() + 30);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Send fu_1 template to leads with BOM scheduled for tomorrow
 * who haven't received the first follow-up yet
 */
router.post("/send-fu1", async (req: Request, res: Response) => {
  try {
    // Get all leads where:
    // - fu_bom_sent is false
    // - bom_date is tomorrow
    const leads = await leadRepository.findAllByQuery(
      "SELECT * FROM leads WHERE opted_out = FALSE AND fu_bom_sent = FALSE AND bom_date IS NOT NULL",
    );

    // Filter leads where bom_date is tomorrow
    const tomorrowLeads = leads.filter(
      (lead) => lead.bom_date && isTomorrow(lead.bom_date),
    );

    const results = [];

    // Process each lead
    for (const lead of tomorrowLeads) {
      try {
        if (!lead.lead_phone) {
          continue;
        }

        // Format the BOM date in IST timezone
        const bomDateIST = formatDateInIST(lead.bom_date!);

        // Create template parameters
        const params: ITemplateParameter[] = [
          { parameter_name: "slot", type: "TEXT", text: bomDateIST },
        ];

        // Send the fu_1 template
        const result = await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "fu_1",
          params,
          "en_US",
        );

        // Update lead record to mark fu_bom_sent as true
        await leadRepository.update(lead.id!, {
          fu_bom_sent: true,
        });

        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "success",
          bom_date: bomDateIST,
        });
      } catch (error) {
        LogsUtils.logError(
          `Failed to send fu_1 to lead ID: ${lead.id}`,
          error as Error,
        );
        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      processed_count: tomorrowLeads.length,
      results,
    });
  } catch (error) {
    LogsUtils.logError("Failed to process fu_1 follow-ups", error as Error);
    res.status(500).json({
      error: "Failed to process fu_1 follow-ups",
      message: (error as Error).message,
    });
  }
});

/**
 * Send fu_2 template to leads with BOM scheduled for today
 * who have confirmed the first follow-up but haven't received the second follow-up
 */
router.post("/send-fu2", async (req: Request, res: Response) => {
  try {
    // Get all leads where:
    // - fu2_bom_sent is false
    // - fu_bom_confirmed is true
    // - bom_date is today
    const leads = await leadRepository.findAllByQuery(
      "SELECT * FROM leads WHERE opted_out = FALSE AND fu2_bom_sent = FALSE AND fu_bom_confirmed = TRUE AND bom_date IS NOT NULL",
    );

    // Filter leads where bom_date is today
    const todayLeads = leads.filter(
      (lead) => lead.bom_date && isToday(lead.bom_date),
    );

    const results = [];

    // Process each lead
    for (const lead of todayLeads) {
      try {
        if (!lead.lead_phone) {
          continue;
        }

        // Format the BOM date in IST timezone
        const bomDateIST = formatDateInIST(lead.bom_date!);

        // Create template parameters
        const params: ITemplateParameter[] = [
          { parameter_name: "slot", type: "TEXT", text: bomDateIST },
        ];

        // Send the fu_2 template
        const result = await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "fu_2",
          params,
          "en_US",
        );

        // Update lead record to mark fu2_bom_sent as true
        await leadRepository.update(lead.id!, {
          fu2_bom_sent: true,
        });

        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "success",
          bom_date: bomDateIST,
        });
      } catch (error) {
        LogsUtils.logError(
          `Failed to send fu_2 to lead ID: ${lead.id}`,
          error as Error,
        );
        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      processed_count: todayLeads.length,
      results,
    });
  } catch (error) {
    LogsUtils.logError("Failed to process fu_2 follow-ups", error as Error);
    res.status(500).json({
      error: "Failed to process fu_2 follow-ups",
      message: (error as Error).message,
    });
  }
});

/**
 * Send 15_mins_before_bom reminder to leads with BOM scheduled for today
 * who have confirmed the second follow-up
 */
router.post("/send-15min-reminder", async (req: Request, res: Response) => {
  try {
    // Get all leads where:
    // - fu2_bom_confirmed is true
    // - bom_date is today
    // - The time is approaching their BOM time (within 15-20 minutes)
    const leads = await leadRepository.findAllByQuery(
      "SELECT * FROM leads WHERE opted_out = FALSE AND fu2_bom_confirmed = TRUE AND yes_bom_sent = FALSE AND bom_date IS NOT NULL",
    );

    const now = new Date();
    // Filter leads where:
    // - bom_date is today
    // - bom_time is within the next 15-20 minutes
    const reminderLeads = leads.filter((lead) => {
      if (!lead.bom_date) return false;

      // Check if the date is today
      if (!isToday(lead.bom_date)) return false;

      return true;

      // Calculate the time difference in minutes
      // const diffMs = lead.bom_date.getTime() - now.getTime();
      // const diffMinutes = Math.floor(diffMs / 60000);
      //
      // return diffMinutes >= 15 && diffMinutes <= 20;
    });

    const results = [];

    // Process each lead
    for (const lead of reminderLeads) {
      try {
        if (!lead.lead_phone) {
          continue;
        }

        // Send the 15_mins_before_bom template
        const result = await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "15_mins_before_bom",
          [], // No parameters needed for this template
          "en_US",
        );

        // Update lead record to mark yes_bom_sent as true
        await leadRepository.update(lead.id!, {
          yes_bom_sent: true,
        });

        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "success",
          bom_date: formatDateInIST(lead.bom_date!),
        });
      } catch (error) {
        LogsUtils.logError(
          `Failed to send 15-minute reminder to lead ID: ${lead.id}`,
          error as Error,
        );
        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      processed_count: reminderLeads.length,
      results,
    });
  } catch (error) {
    LogsUtils.logError("Failed to process 15-minute reminders", error as Error);
    res.status(500).json({
      error: "Failed to process 15-minute reminders",
      message: (error as Error).message,
    });
  }
});

/**
 * Send book_bom template with Zoom link to leads who confirmed attendance
 */
router.post("/send-zoom-link", async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body.zoom_link) {
      res.status(400).json({ error: "Zoom link is required" });
      return;
    }

    const zoomLink = req.body.zoom_link;

    // Get all leads where:
    // - yes_bom_pressed is true
    // - bom_date is today
    const leads = await leadRepository.findAllByQuery(
      "SELECT * FROM leads WHERE opted_out = FALSE AND yes_bom_pressed = TRUE and link_bom_sent = FALSE and bom_text = 'BOM' AND bom_date IS NOT NULL",
    );

    // Filter leads where bom_date is today
    const todayLeads = leads.filter(
      (lead) => lead.bom_date && isToday(lead.bom_date),
    );

    const results = [];

    // Process each lead
    for (const lead of todayLeads) {
      try {
        if (!lead.lead_phone) {
          continue;
        }

        // Create template parameters with the Zoom link
        const params: ITemplateParameter[] = [
          { parameter_name: "zoom_link", type: "TEXT", text: zoomLink },
        ];

        // Send the book_bom template with Zoom link
        const result = await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "book_bom",
          params,
          "en_US",
        );

        // Update lead record to mark link_bom_sent as true
        await leadRepository.update(lead.id!, {
          link_bom_sent: true,
        });

        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "success",
          bom_date: formatDateInIST(lead.bom_date!),
        });
      } catch (error) {
        LogsUtils.logError(
          `Failed to send Zoom link to lead ID: ${lead.id}`,
          error as Error,
        );
        results.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      processed_count: todayLeads.length,
      results,
    });
  } catch (error) {
    LogsUtils.logError("Failed to process Zoom link sending", error as Error);
    res.status(500).json({
      error: "Failed to process Zoom link sending",
      message: (error as Error).message,
    });
  }
});

/**
 * Send not_ready_bom template to all leads who have BOM scheduled for today
 * but haven't pressed the attendance confirmation button
 */
router.post("/send-not-ready-bom", async (req: Request, res: Response) => {
  try {
    // Get all leads with BOM scheduled for today who haven't confirmed attendance
    const leads = await leadRepository.findAllByQuery(`
      SELECT
        id,
        lead_name,
        lead_phone,
        bom_text,
        bom_date,
        fu_bom_sent,
        fu_bom_confirmed,
        fu2_bom_sent,
        fu2_bom_confirmed,
        yes_bom_sent,
        link_bom_sent
      FROM
        leads
      WHERE
        DATE(bom_date) = CURRENT_DATE
        AND bom_text IS NOT NULL
        AND yes_bom_pressed = false
        AND opted_out = false
        AND needs_attention = FALSE
    `);

    LogsUtils.logMessage(
      `Found ${leads.length} leads for bulk not_ready_bom send`,
    );

    // Process results storage
    const results = {
      total: leads.length,
      sent: 0,
      failed: 0,
      details: [] as Array<{
        lead_id: number | undefined;
        lead_phone: string | undefined;
        lead_name: string | undefined;
        status: "success" | "failed";
        error?: string;
      }>,
    };

    // Send messages to each lead
    for (const lead of leads) {
      try {
        if (!lead.lead_phone) {
          results.failed++;
          results.details.push({
            lead_id: lead.id,
            lead_phone: lead.lead_phone,
            lead_name: lead.lead_name,
            status: "failed",
            error: "Missing phone number",
          });
          continue;
        }

        // Send the not_ready_bom template
        await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "not_ready_bom",
          [],
          "en_US",
        );

        await leadRepository.update(lead.id!, {
          needs_attention: true,
        });

        LogsUtils.logMessage(
          `Sent not_ready_bom template to ${lead.lead_name} (${lead.lead_phone})`,
        );

        results.sent++;
        results.details.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          lead_name: lead.lead_name,
          status: "success",
        });

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        LogsUtils.logError(
          `Failed to send not_ready_bom template to lead ID: ${lead.id}`,
          error as Error,
        );

        results.failed++;
        results.details.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          lead_name: lead.lead_name,
          status: "failed",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk not_ready_bom send completed: ${results.sent} sent, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    LogsUtils.logError(
      "Failed to process bulk not_ready_bom send",
      error as Error,
    );
    res.status(500).json({
      error: "Failed to process bulk not_ready_bom send",
      message: (error as Error).message,
    });
  }
});

/**
 * Send no_code_bom template to all leads who have BOM scheduled for today,
 * haven't pressed the attendance confirmation button, and don't have BIT scheduled
 */
router.post("/send-no-code-bom", async (req: Request, res: Response) => {
  try {
    // Get all leads matching the specified criteria
    const leads = await leadRepository.findAllByQuery(`
      SELECT
        id,
        lead_name,
        lead_phone,
        bom_text,
        bom_date,
        fu_bom_sent,
        fu_bom_confirmed,
        fu2_bom_sent,
        fu2_bom_confirmed,
        yes_bom_sent,
        link_bom_sent
      FROM
        leads
      WHERE
        DATE(bom_date) = CURRENT_DATE
        AND bom_text IS NOT NULL
        AND yes_bom_pressed = TRUE
        AND bit_text IS NULL
        AND bit_date IS NULL
        AND opted_out = FALSE
        AND needs_attention = FALSE
    `);

    LogsUtils.logMessage(
      `Found ${leads.length} leads for bulk no_code_bom send`,
    );

    // Process results storage
    const results = {
      total: leads.length,
      sent: 0,
      failed: 0,
      details: [] as Array<{
        lead_id: number | undefined;
        lead_phone: string | undefined;
        lead_name: string | undefined;
        status: "success" | "failed";
        error?: string;
      }>,
    };

    // Send messages to each lead
    for (const lead of leads) {
      try {
        if (!lead.lead_phone) {
          results.failed++;
          results.details.push({
            lead_id: lead.id,
            lead_phone: lead.lead_phone,
            lead_name: lead.lead_name,
            status: "failed",
            error: "Missing phone number",
          });
          continue;
        }

        // Create template parameter for the name
        const params: ITemplateParameter[] = [
          {
            parameter_name: "name",
            type: "TEXT",
            text: lead.lead_name || "Hello",
          },
        ];

        // Send the no_code_bom template with the name parameter
        await LeadsUtils.sendTemplateMessage(
          lead.lead_phone,
          "no_code_bom",
          params,
          "en_US",
        );

        await leadRepository.update(lead.id!, {
          needs_attention: true,
        });

        LogsUtils.logMessage(
          `Sent no_code_bom template to ${lead.lead_name} (${lead.lead_phone})`,
        );

        results.sent++;
        results.details.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          lead_name: lead.lead_name,
          status: "success",
        });

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        LogsUtils.logError(
          `Failed to send no_code_bom template to lead ID: ${lead.id}`,
          error as Error,
        );

        results.failed++;
        results.details.push({
          lead_id: lead.id,
          lead_phone: lead.lead_phone,
          lead_name: lead.lead_name,
          status: "failed",
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk no_code_bom send completed: ${results.sent} sent, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    LogsUtils.logError(
      "Failed to process bulk no_code_bom send",
      error as Error,
    );
    res.status(500).json({
      error: "Failed to process bulk no_code_bom send",
      message: (error as Error).message,
    });
  }
});

export default router;
