// src/utils/messages.utils.ts
import MessagesRepository from "../repositories/messages.repository";
import {
  ITemplateParameter,
  MessageDirection,
  MessageType,
} from "../typescript/interfaces";
import TemplateRepository from "../repositories/template.repository";
import LogsUtils from "./logs.utils";
import { LeadRepository } from "../repositories/lead.repository"; // Add this import
import LeadsUtils from "./leads.utils"; // Add this import

// Create an instance of LeadRepository
const leadRepository = new LeadRepository();

class MessagesUtils {
  async processIncomingMessage(wa_message: any) {
    const message = wa_message.messages[0];
    const phone = message.from;
    const contextId = !!message.context ? message.context.id : "";

    switch (message.type) {
      case MessageType.TEXT:
        // Check if this is an interest message
        if (
          message.text.body.toLowerCase().includes("interested") &&
          message.text.body
            .toLowerCase()
            .includes("global dropshipping project")
        ) {
          try {
            // Check if lead already exists
            const existingLead = await leadRepository.findByPhone(phone);

            if (!existingLead) {
              // Extract contact name from the message metadata
              const contactName =
                wa_message.contacts?.[0]?.profile?.name || "New Lead";

              const currentDate = new Date();

              // Create new lead
              const newLead = await leadRepository.create({
                lead_name: contactName,
                lead_phone: phone,
                opted_out: false,
                fu_bom_sent: false,
                fu_bom_confirmed: false,
                fu2_bom_sent: false,
                fu_bit_sent: false,
                fu2_bit_sent: false,
                created_at: currentDate,
              });

              await this.saveMessageToDb(
                wa_message,
                phone,
                MessageDirection.INCOMING,
                "",
                message.text.body,
                undefined,
                contextId,
                MessageType.TEXT,
              );

              // Send lb_2 template with no parameters
              await LeadsUtils.sendTemplateMessage(phone, "lb_2", [], "en");

              LogsUtils.logMessage(
                `Created new lead from interest message and sent lb_2: ${contactName} (${phone})`,
              );
            } else {
              // Lead already exists
              LogsUtils.logMessage(
                `Received interest message from existing lead: ${existingLead.lead_name} (${phone})`,
              );
            }
          } catch (error) {
            LogsUtils.logError(
              `Error processing interest message from ${phone}`,
              error as Error,
            );
          }
        } else {
          await this.saveMessageToDb(
            wa_message,
            phone,
            MessageDirection.INCOMING,
            "",
            message.text.body,
            undefined,
            contextId,
            MessageType.TEXT,
          );
        }
        break;
      case MessageType.REACTION:
        await this.saveMessageToDb(
          wa_message,
          phone,
          MessageDirection.INCOMING,
          "",
          message.reaction.emoji,
          undefined,
          message.reaction.message_id,
          MessageType.REACTION,
        );
        break;
      case MessageType.BUTTON:
        await this.saveMessageToDb(
          wa_message,
          phone,
          MessageDirection.INCOMING,
          "",
          message.button.payload,
          undefined,
          contextId,
          MessageType.BUTTON,
        );
        break;
      case MessageType.IMAGE:
        await this.saveMessageToDb(
          wa_message,
          phone,
          MessageDirection.INCOMING,
          "",
          message.image.caption,
          undefined,
          contextId,
          MessageType.IMAGE,
          message.image.id,
        );
        break;
      case MessageType.VIDEO:
        await this.saveMessageToDb(
          wa_message,
          phone,
          MessageDirection.INCOMING,
          "",
          message.video.caption,
          undefined,
          contextId,
          MessageType.VIDEO,
          message.video.id,
        );
        break;
      default:
        LogsUtils.logMessage(`Unknown message type: ${message.type}`);
    }
  }

  async saveMessageToDb(
    wa_message: any,
    phone: string,
    direction: MessageDirection,
    templateName?: string,
    messageText?: string,
    templateParams?: ITemplateParameter[],
    contextId?: string,
    type?: MessageType,
    mediaId?: string,
  ) {
    if (
      !!wa_message.messages[0]?.id && !!templateName
        ? wa_message.messages[0]?.message_status === "accepted"
        : true
    ) {
      const timestamp = new Date();
      let templateText = !!templateName
        ? (await TemplateRepository.findByName(templateName))?.template_text
        : "";
      if (!!templateText && !!templateParams && templateParams.length > 0) {
        templateParams?.forEach((param) => {
          templateText = templateText?.replace(
            `{{${param.parameter_name}}}`,
            param.text!,
          );
        });
      }
      await MessagesRepository.create({
        lead_phone: phone,
        direction: direction,
        template_name: templateName,
        message_text: messageText || templateText,
        wa_id: wa_message.messages[0].id,
        wa_response_id: contextId,
        type: type,
        media_id: mediaId,
        timestamp: timestamp,
      });
    }
  }
}

export default new MessagesUtils();
