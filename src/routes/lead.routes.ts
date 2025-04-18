import { Request, Response, Router } from "express";
import { LeadRepository } from "../repositories/lead.repository";
import LogsUtils from "../utils/logs.utils";
import LeadsUtils from "../utils/leads.utils";
import conversationsRepository from "../repositories/conversations.repository";
import { ChannelType } from "../typescript/interfaces";
import TelegramUtils from "../utils/telegram.utils";

const router = Router();
const leadRepository = new LeadRepository();

// Get all leads
router.get("/", async (req: Request, res: Response) => {
  try {
    const leads = await leadRepository.findAll();

    res.json(leads);
  } catch (error) {
    LogsUtils.logError("Failed to fetch leads", error as Error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Get lead by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const lead = await leadRepository.findById(Number(req.params.id));
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (error) {
    LogsUtils.logError(
      `Failed to fetch lead ID: ${req.params.id}`,
      error as Error,
    );
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Get conversations by phone number
router.get("/:id/conversations", async (req: Request, res: Response) => {
  try {
    const conversations = await conversationsRepository.findByLeadId(
      Number(req.params.id),
    );

    if (!conversations) {
      res.status(404).json({ error: "Conversations not found" });
      return;
    }
    res.json(conversations);
  } catch (error) {
    LogsUtils.logError(
      `Failed to fetch conversations by phone: ${req.params.phone}`,
      error as Error,
    );
    res.status(500).json({
      error: `Failed to fetch conversations by phone: ${req.params.phone}`,
    });
  }
});

// Get lead by phone
router.get("/phone/:phone", async (req: Request, res: Response) => {
  try {
    const lead = await leadRepository.findByPhone(req.params.phone);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (error) {
    LogsUtils.logError(
      `Failed to fetch lead ID: ${req.params.id}`,
      error as Error,
    );
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create new lead
router.post("/", async (req: Request, res: Response) => {
  try {
    // Check if lead with this phone number already exists
    const existingLead = await leadRepository.findByPhone(req.body.phone);
    if (existingLead) {
      res.status(409).json({
        error: "Lead with this phone number already exists",
        leadId: existingLead.id,
      });
    }

    const newLead = await leadRepository.create(req.body);
    res.status(201).json(newLead);
  } catch (error) {
    LogsUtils.logError("Failed to create lead", error as Error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updatedLead = await leadRepository.update(
      Number(req.params.id),
      req.body,
    );
    if (!updatedLead) {
      res.status(404).json({ error: "Lead not found" });
    }
    res.json(updatedLead);
  } catch (error) {
    LogsUtils.logError(
      `Failed to update lead ID: ${req.params.id}`,
      error as Error,
    );
    res.status(500).json({ error: "Failed to update lead" });
  }
});

router.post("/initiate-conversation", async (req: Request, res: Response) => {
  try {
    const newLeads = await LeadsUtils.initiateConversation();
    res.json({ new_leads: newLeads, success: true });
  } catch (error) {
    LogsUtils.logError("Failed to initiate conversation", error as Error);
    res.status(500).json({ error: "Failed to initiate conversation" });
  }
});

// Delete lead
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await leadRepository.delete(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Lead not found" });
    }
    res.status(204).send();
  } catch (error) {
    LogsUtils.logError(
      `Failed to delete lead ID: ${req.params.id}`,
      error as Error,
    );
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Send template message to a lead by phone number
router.post(
  "/phone/:phone/send-template",
  async (req: Request, res: Response) => {
    try {
      const { templateName, parameters, language } = req.body;

      if (!templateName) {
        res.status(400).json({ error: "Template name is required" });
      }

      const phone = req.params.phone;
      const lead = await leadRepository.findByPhone(phone);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
      }

      const result = await LeadsUtils.sendTemplateMessage(
        phone,
        templateName,
        parameters || [],
        language || "en_US",
      );

      res.json({ success: true, result });
    } catch (error) {
      LogsUtils.logError(
        `Failed to send template message to phone: ${req.params.phone}`,
        error as Error,
      );
      res.status(500).json({ error: "Failed to send template message" });
    }
  },
);

// Send free-form message to a lead by phone number
router.post("/:id/send-message", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message text is required" });
    }

    const id = Number(req.params.id);
    const lead = await leadRepository.findById(id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
    }

    if (lead?.channel == ChannelType.TELEGRAM) {
      await TelegramUtils.sendMessage(lead?.tg_chat_id!, message);
    } else {
      await LeadsUtils.sendFreeFormMessage(lead?.lead_phone!, message);
    }

    res.json({ success: true });
  } catch (error) {
    LogsUtils.logError(
      `Failed to send message to phone: ${req.params.phone}`,
      error as Error,
    );
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Switch needs attention
router.post(
  "/:id/switch-needs-attention",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const lead = await leadRepository.findById(id);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
      }

      const result = await LeadsUtils.switchNeedsAttention(
        lead?.id!,
        !lead?.needs_attention!,
      );

      res.json({ success: true, result });
    } catch (error) {
      LogsUtils.logError(
        `Failed to switch needs attention: ${req.params.phone}`,
        error as Error,
      );
      res.status(500).json({ error: "Failed to switch needs attention" });
    }
  },
);

// Send next_step_ready
router.post(
  "/phone/:phone/send-next-step-ready",
  async (req: Request, res: Response) => {
    try {
      const phone = req.params.phone;
      const { language } = req.body;
      const lead = await leadRepository.findByPhone(phone);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
      }

      const result = await LeadsUtils.sendTemplateMessage(
        phone,
        "next_step_ready",
        [],
        language || "en_US",
      );

      res.json({ success: true, result });
    } catch (error) {
      LogsUtils.logError(
        `Failed to send next_step_ready: ${req.params.phone}`,
        error as Error,
      );
      res.status(500).json({ error: "Failed to sent next_step_ready" });
    }
  },
);

export default router;
