import MessagesRepository from "../repositories/messages.repository";
import {
  ITemplateParameter,
  MessageDirection,
  MessageType,
} from "../typescript/interfaces";
import TemplateRepository from "../repositories/template.repository";
import LogsUtils from "./logs.utils";

class MessagesUtils {
  async processIncomingMessage(wa_message: any) {
    const message = wa_message.messages[0];
    const phone = message.from;
    const contextId = !!message.context ? message.context.id : "";

    switch (message.type) {
      case MessageType.TEXT:
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
  private formatTimestamp(wa_message: any): Date {
    try {
      // Try to create a date from the timestamp and ensure it's UTC
      const timestampValue = Number(wa_message.messages[0].timestamp) * 1000;
      const date = new Date(timestampValue);

      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        // Convert to UTC by creating a new Date with UTC methods
        return new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds(),
          ),
        );
      }
    } catch (error) {
      // Just continue to the fallback
    }

    // For fallback, create current time in UTC
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds(),
      ),
    );
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
      // TODO
      const timestamp = new Date(); // this.formatTimestamp(wa_message);
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
