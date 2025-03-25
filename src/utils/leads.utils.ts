import WhatsappUtils from "./whatsapp.utils";
import NewLeadsRepository from "../repositories/new-leads.repository";
import LogsUtils from "./logs.utils";
import { ITemplateParameter, MessageDirection } from "../typescript/interfaces";
import MessagesUtils from "./messages.utils";
import { LeadRepository } from "../repositories/lead.repository";
import TemplateRepository from "../repositories/template.repository";
import FBTemplateRepository from "../repositories/fb-template.repository";

class LeadsUtils {
  private readonly leadRepository = new LeadRepository();

  async initiateConversation() {
    try {
      const newLeads = await NewLeadsRepository.findAll();
      for (const lead of newLeads) {
        const params: ITemplateParameter[] = [
          { parameter_name: "name", type: "TEXT", text: lead.lead_name! },
        ];
        const wa_message = await WhatsappUtils.sendTemplateWithParams(
          lead.lead_phone!,
          "lb_1",
          params,
          "en_US",
        );

        await MessagesUtils.saveMessageToDb(
          wa_message,
          lead.lead_phone!,
          MessageDirection.OUTGOING,
          "lb_1",
          "",
          params,
        );
      }
      return newLeads;
    } catch (error) {
      LogsUtils.logError("Failed to initiate conversation", error as Error);
    }
  }

  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters: ITemplateParameter[] = [],
    language: string = "en_US",
  ): Promise<any> {
    try {
      const t = await TemplateRepository.findByName(templateName);
      const fbName = !!t?.wa_id
        ? (await FBTemplateRepository.findByWaId(t?.wa_id!))?.name!
        : templateName;

      // Send template message via WhatsApp API
      const result = await WhatsappUtils.sendTemplateWithParams(
        phoneNumber,
        fbName,
        parameters,
        language,
      );

      await MessagesUtils.saveMessageToDb(
        result,
        phoneNumber,
        MessageDirection.OUTGOING,
        templateName,
        "",
        parameters,
        undefined,
        undefined,
        undefined,
        fbName,
      );

      LogsUtils.logMessage(
        `Template message '${templateName}' sent to ${phoneNumber}`,
      );
      return result;
    } catch (error) {
      LogsUtils.logError(
        `Failed to send template message to ${phoneNumber}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendFreeFormMessage(
    phoneNumber: string,
    message: string,
  ): Promise<any> {
    try {
      // Send free-form message via WhatsApp API
      const result = await WhatsappUtils.sendTextMessage(phoneNumber, message);

      await MessagesUtils.saveMessageToDb(
        result,
        phoneNumber,
        MessageDirection.OUTGOING,
        undefined,
        message,
      );

      LogsUtils.logMessage(
        `Free-form message sent to ${phoneNumber}: "${message}"`,
      );
      return result;
    } catch (error) {
      LogsUtils.logError(
        `Failed to send free-form message to ${phoneNumber}`,
        error as Error,
      );
      throw error;
    }
  }

  async switchNeedsAttention(id: number, value: boolean): Promise<any> {
    try {
      const result = await this.leadRepository.update(id, {
        needs_attention: value,
      });
      LogsUtils.logMessage(`Switched attention for lead id: ${id}"`);
      return result;
    } catch (error) {
      LogsUtils.logError(
        `Failed to switched attention for lead id: ${id}`,
        error as Error,
      );
      throw error;
    }
  }
}

export default new LeadsUtils();
