import MessagesRepository from "../repositories/messages.repository";
import {
  ITemplateParameter,
  MessageDirection,
  MessageType,
  BomStatus,
} from "../typescript/interfaces";
import TemplateRepository from "../repositories/template.repository";
import LogsUtils from "./logs.utils";
import SocketUtils from "./socket.utils";
import LeadsUtils from "./leads.utils";
import { LeadRepository } from "../repositories/lead.repository";
import BookUtils from "./book.utils";

// Create an instance of LeadRepository
const leadRepository = new LeadRepository();

// Map to temporarily store selected time slots
const selectedTimeSlots = new Map<string, string>();

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
              await leadRepository.create({
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

        // Handle button responses for marketing funnel
        await this.processButtonResponse(
          wa_message,
          phone,
          message.button.payload,
          contextId,
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

  /**
   * Process button responses for the marketing funnel
   * @param wa_message WhatsApp message object
   * @param phone User's phone number
   * @param buttonPayload Button payload text
   * @param contextId Message context ID
   */
  async processButtonResponse(
    wa_message: any,
    phone: string,
    buttonPayload: string,
    contextId: string,
  ) {
    try {
      // Get message context to determine which template this is a response to
      const contextMessageId = contextId;
      if (!contextMessageId) {
        LogsUtils.logMessage(
          `No context message ID for button press from ${phone}`,
        );
        return;
      }

      // Find the original message this button is responding to
      const originalMessage =
        await MessagesRepository.findByWaId(contextMessageId);
      if (!originalMessage) {
        LogsUtils.logMessage(
          `Could not find original message ${contextMessageId} for button press from ${phone}`,
        );
        return;
      }

      // Now we can determine which step in the funnel this button press belongs to
      if (
        originalMessage.template_name === "lb_2" &&
        buttonPayload === "Interested"
      ) {
        // User pressed "Interested" in lb_2 - send lb_3
        LogsUtils.logMessage(
          `User ${phone} pressed Interested in lb_2, sending lb_3`,
        );
        await LeadsUtils.sendTemplateMessage(phone, "lb_3", [], "en");
      } else if (
        originalMessage.template_name === "lb_3" &&
        buttonPayload === "Yes"
      ) {
        // User pressed "Yes" in lb_3 - send lb_4 with time slots
        LogsUtils.logMessage(
          `User ${phone} pressed Yes in lb_3, sending lb_4 with time slots`,
        );

        // Get next available BOM dates
        const bomDates = BookUtils.getNextBomDates();
        if (bomDates.length < 2) {
          LogsUtils.logError(
            `Not enough BOM dates available for ${phone}`,
            new Error(`Expected 2 dates but got ${bomDates.length}`),
          );
          return;
        }

        // Create template parameters for the two time slots
        const params: ITemplateParameter[] = [
          { parameter_name: "slot_1", type: "TEXT", text: bomDates[0] },
          { parameter_name: "slot_2", type: "TEXT", text: bomDates[1] },
        ];

        // Store the date options in memory for this phone number
        selectedTimeSlots.set(`${phone}_slot_1`, bomDates[0]);
        selectedTimeSlots.set(`${phone}_slot_2`, bomDates[1]);

        // Send lb_4 template with the time slot parameters
        await LeadsUtils.sendTemplateMessage(phone, "lb_4", params, "en");
      } else if (originalMessage.template_name === "lb_4") {
        // User selected a time slot from lb_4 - determine which slot and save it
        let selectedSlot: string | null = null;

        if (buttonPayload === "Slot 1") {
          selectedSlot = selectedTimeSlots.get(`${phone}_slot_1`) || null;
        } else if (buttonPayload === "Slot 2") {
          selectedSlot = selectedTimeSlots.get(`${phone}_slot_2`) || null;
        }

        if (!selectedSlot) {
          LogsUtils.logError(
            `Could not find selected time slot for ${phone}`,
            new Error(`No slot found for ${buttonPayload}`),
          );
          return;
        }

        // Store the selected time slot for this user
        selectedTimeSlots.set(`${phone}_selected`, selectedSlot);

        LogsUtils.logMessage(
          `User ${phone} selected ${buttonPayload}: ${selectedSlot}, sending lb_5`,
        );

        // Send lb_5 template
        await LeadsUtils.sendTemplateMessage(phone, "lb_5", [], "en");
      } else if (
        originalMessage.template_name === "lb_5" &&
        buttonPayload === "Yes"
      ) {
        // User pressed "Yes" in lb_5 - send lb_6 and update database
        const selectedSlot = selectedTimeSlots.get(`${phone}_selected`);
        if (!selectedSlot) {
          LogsUtils.logError(
            `No selected time slot found for ${phone}`,
            new Error("Missing selected time slot"),
          );
          return;
        }

        LogsUtils.logMessage(
          `User ${phone} confirmed BOM attendance for ${selectedSlot}, sending lb_6`,
        );

        // Send lb_6 template
        await LeadsUtils.sendTemplateMessage(phone, "lb_6", [], "en");

        // Update lead record in database
        const lead = await leadRepository.findByPhone(phone);
        if (!lead) {
          LogsUtils.logError(
            `No lead found for ${phone}`,
            new Error("Lead not found"),
          );
          return;
        }

        // Parse the date from the selected time slot
        // Format example: "Today, 11.03.25, 16:30 IST"
        const dateMatch = selectedSlot.match(/(\d{2}\.\d{2}\.\d{2})/);
        if (!dateMatch) {
          LogsUtils.logError(
            `Could not parse date from ${selectedSlot}`,
            new Error("Invalid date format"),
          );
          return;
        }

        const dateString = dateMatch[1]; // "11.03.25"
        const timeMatch = selectedSlot.match(/(\d{2}:\d{2})/);
        const timeString = timeMatch ? timeMatch[1] : "16:30"; // Default to 16:30 if no time found

        // Parse the date - format is DD.MM.YY
        const parts = dateString.split(".");
        // Note: JavaScript months are 0-indexed, so we subtract 1 from the month
        const year = 2000 + parseInt(parts[2]); // Assuming 20xx years
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[0]);

        // Create a date object for the selected time in IST
        const bomDateIST = new Date(year, month, day);

        // Set the time part - format is HH:MM
        const timeParts = timeString.split(":");
        bomDateIST.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);

        // Convert from IST to UTC (IST is UTC+5:30)
        // We need to subtract 5 hours and 30 minutes to get UTC time
        const bomDate = new Date(bomDateIST.getTime());
        bomDate.setHours(bomDateIST.getHours() - 5);
        bomDate.setMinutes(bomDateIST.getMinutes() - 30);

        // Update the lead record
        await leadRepository.update(lead.id!, {
          bom_text: BomStatus.BOM,
          bom_date: bomDate,
          fu_bom_confirmed: true,
        });

        LogsUtils.logMessage(
          `Updated lead record for ${phone}: BOM=${BomStatus.BOM}, date=${bomDate.toISOString()}`,
        );

        // Clean up stored slots to free memory
        selectedTimeSlots.delete(`${phone}_slot_1`);
        selectedTimeSlots.delete(`${phone}_slot_2`);
        selectedTimeSlots.delete(`${phone}_selected`);
      }
    } catch (error) {
      LogsUtils.logError(
        `Error processing button response from ${phone}`,
        error as Error,
      );
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

      const messageData = {
        lead_phone: phone,
        direction: direction,
        template_name: templateName,
        message_text: messageText || templateText,
        wa_id: wa_message.messages[0].id,
        wa_response_id: contextId,
        type: type,
        media_id: mediaId,
        timestamp: timestamp,
      };

      // Save message to database
      const savedMessage = await MessagesRepository.create(messageData);

      // Notify connected clients about the new message (both incoming and outgoing)
      SocketUtils.notifyNewMessage(phone, savedMessage);

      return savedMessage;
    }

    return null;
  }
}

export default new MessagesUtils();
