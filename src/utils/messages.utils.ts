import MessagesRepository from "../repositories/messages.repository";
import { ITemplateParameter, MessageDirection } from "../typescript/interfaces";
import TemplateRepository from "../repositories/template.repository";

class MessagesUtils {
  async saveMessageToDb(
    wa_message: any,
    phone: string,
    direction: MessageDirection,
    templateName?: string,
    messageText?: string,
    templateParams?: ITemplateParameter[],
  ) {
    if (
      !!wa_message.messages[0]?.id && !!templateName
        ? wa_message.messages[0]?.message_status === "accepted"
        : true
    ) {
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
      });
    }
  }
}

export default new MessagesUtils();
