import MessagesRepository from "../repositories/messages.repository";
import {
  ITemplateParameter,
  MessageDirection,
  MessageType,
} from "../typescript/interfaces";
import TemplateRepository from "../repositories/template.repository";
import LogsUtils from "./logs.utils";
import SocketUtils from "./socket.utils";

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
