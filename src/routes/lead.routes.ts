import { Router, Request, Response } from "express";
import { LeadRepository } from "../repositories/lead.repository";
import LogsUtils from "../utils/logs.utils";
import LeadsUtils from "../utils/leads.utils";
import conversationsRepository from "../repositories/conversations.repository";

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
router.get("/:phone/conversations", async (req: Request, res: Response) => {
  try {
    const conversations = await conversationsRepository.findByPhone(
      req.params.phone,
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
router.get("/byphone/:phone", async (req: Request, res: Response) => {
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

export default router;
