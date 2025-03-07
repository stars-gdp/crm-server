import WhatsappUtils from "./whatsapp.utils";
import NewLeadsRepository from "../repositories/new-leads.repository";
import LogsUtils from "./logs.utils";
import MessagesRepository from "../repositories/messages.repository";
import { MessageDirection } from "../typescript/interfaces";
import { TemplatesConfig } from "../config/templates_config";

class LeadsUtils {
  async initiateConversation() {
    try {
      const newLeads = await NewLeadsRepository.findAll();
      for (const lead of newLeads) {
        await WhatsappUtils.sendTemplateWithParams(
          lead.lead_phone!,
          TemplatesConfig.lb1.name,
          [{ parameter_name: "name", type: "TEXT", text: lead.lead_name! }],
          "en",
        );

        await MessagesRepository.create({
          lead_phone: lead.lead_phone,
          direction: MessageDirection.OUTGOING,
          template_name: TemplatesConfig.lb1.name,
        });
      }
      return newLeads;
    } catch (error) {
      LogsUtils.logError("Failed to initiate conversation", error as Error);
    }
  }
}

export default new LeadsUtils();
