import WhatsappUtils from "./whatsapp.utils";
import NewLeadsRepository from "../repositories/new-leads.repository";
import LogsUtils from "./logs.utils";
import { ITemplateParameter, MessageDirection } from "../typescript/interfaces";
import { TemplatesConfig } from "../config/templates_config";
import MessagesUtils from "./messages.utils";

class LeadsUtils {
  async initiateConversation() {
    try {
      const newLeads = await NewLeadsRepository.findAll();
      for (const lead of newLeads) {
        const params: ITemplateParameter[] = [
          { parameter_name: "name", type: "TEXT", text: lead.lead_name! },
        ];
        const wa_message = await WhatsappUtils.sendTemplateWithParams(
          lead.lead_phone!,
          TemplatesConfig.lb1.name,
          params,
          "en",
        );

        await MessagesUtils.saveMessageToDb(
          wa_message,
          lead.lead_phone!,
          MessageDirection.OUTGOING,
          TemplatesConfig.lb1.name,
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
    language: string = "en",
  ): Promise<any> {
    try {
      // Send template message via WhatsApp API
      const result = await WhatsappUtils.sendTemplateWithParams(
        phoneNumber,
        templateName,
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
}

export default new LeadsUtils();
