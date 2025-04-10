import TelegramBot from "node-telegram-bot-api";
import EnvConfig from "../config/env.config";
import LogsUtils from "./logs.utils";
import { LeadRepository } from "../repositories/lead.repository";
import {
  BitStatus,
  BomStatus,
  ChannelType,
  MessageDirection,
  MessageType,
  WgStatus,
} from "../typescript/interfaces";
import MessagesRepository from "../repositories/messages.repository";
import TemplateRepository from "../repositories/template.repository";
import BookUtils from "./book.utils";
import DateUtils from "./date.utils";
import SocketUtils from "./socket.utils";

class TelegramUtils {
  private readonly _bot: TelegramBot;
  private readonly _leadRepository: LeadRepository;

  constructor() {
    this._bot = new TelegramBot(EnvConfig.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
    this._leadRepository = new LeadRepository();
  }

  start() {
    LogsUtils.logMessage("Telegram bot started");
    this._bot.on("callback_query", (callbackQuery) => {
      const message = callbackQuery.message;
      const data = callbackQuery.data;

      this._processInlineResponse(message, data);
    });

    this._bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      const messageText = msg.text || msg.caption;
      const username = msg.from?.username;
      const leadName = msg.from?.first_name + " " + msg.from?.last_name;
      const fileId =
        msg.document?.file_id ||
        msg.video?.file_id ||
        msg.voice?.file_id ||
        msg.photo?.[0].file_id;
      const messageType: MessageType =
        msg.document || msg.photo
          ? MessageType.IMAGE
          : msg.video
            ? MessageType.VIDEO
            : msg.voice || msg.audio
              ? MessageType.VIDEO
              : MessageType.TEXT;

      this._processMessage(
        chatId,
        username,
        leadName,
        messageText,
        messageId,
        fileId,
        messageType,
      );
    });
  }

  private async _processInlineResponse(
    message?: TelegramBot.Message,
    data?: string,
  ) {
    try {
      switch (true) {
        case data === "lb_2":
          const lb3 = await TemplateRepository.findByName("lb_3");
          this.sendMessage(
            message?.chat?.id!,
            lb3?.template_text!,
            lb3?.template_name!,
            JSON.parse(lb3?.tg_inline_keyboard!),
          );
          break;
        case data === "lb_3":
          const lb4 = await TemplateRepository.findByName("lb_4");
          const nextBomDates = BookUtils.getNextBomDates();
          const keyboard = [
            [
              {
                text: nextBomDates[0],
                callback_data: `bom_${DateUtils.dateStringToDate(nextBomDates[0])}`,
              },
            ],
            [
              {
                text: nextBomDates[1],
                callback_data: `bom_${DateUtils.dateStringToDate(nextBomDates[1])}`,
              },
            ],
          ];
          this.sendMessage(
            message?.chat?.id!,
            lb4?.template_text!,
            lb4?.template_name!,
            keyboard,
          );
          break;
        case /^bom_\d{4}-\d{2}-\d{2}$/.test(data || ""): {
          const lb5 = await TemplateRepository.findByName("lb_5");
          this.sendMessage(
            message?.chat?.id!,
            lb5?.template_text!,
            lb5?.template_name!,
            JSON.parse(lb5?.tg_inline_keyboard!),
          );

          const match = data?.match(/^bom_(\d{4}-\d{2}-\d{2})$/);
          const dateString = match?.[1];
          if (dateString) {
            this._leadRepository.updateByTgChatId(message?.chat.id!, {
              bom_date: new Date(dateString),
            });
          }
          break;
        }
        case data === "lb_5": {
          const lead = await this._leadRepository.updateByTgChatId(
            message?.chat.id!,
            {
              bom_text: BomStatus.BOM,
            },
          );
          const lb6 = await TemplateRepository.findByName("lb_6");
          this.sendMessage(
            message?.chat?.id!,
            lb6?.template_text!,
            lb6?.template_name!,
            undefined,
            undefined,
            [{ name: "slot", value: DateUtils.formatBomIST(lead?.bom_date!) }],
          );
          break;
        }
        case data === "fu_1": {
          this._leadRepository.updateByTgChatId(message?.chat.id!, {
            fu_bom_confirmed: true,
          });
          this.sendMessage(
            message?.chat?.id!,
            "Thank you for your confirmation!",
          );
          break;
        }
        case data === "fu_2": {
          this._leadRepository.updateByTgChatId(message?.chat.id!, {
            fu2_bom_confirmed: true,
            yes_bom_pressed: true,
          });
          this.sendMessage(
            message?.chat?.id!,
            "Thank you for your confirmation! You'll get a link at around 15 minutes before the meeting",
          );
          break;
        }
        case data === "15_mins_before_bom": {
          this._leadRepository.updateByTgChatId(message?.chat.id!, {
            yes_bom_pressed: true,
          });
          this.sendMessage(
            message?.chat?.id!,
            "Thank you for your confirmation! You'll get a link shortly",
          );
          break;
        }
        case data === "fu_bit_1": {
          this.sendMessage(
            message?.chat?.id!,
            "Thank you for your confirmation!",
          );
          break;
        }
        case data === "fu_bit_2": {
          this.sendMessage(
            message?.chat?.id!,
            "Thank you for your confirmation! You'll get a link at around 15 minutes before the meeting",
          );
          break;
        }
        case data === "response_Attention": {
          this._leadRepository.updateByTgChatId(message?.chat.id!, {
            needs_attention: true,
          });
          this.sendMessage(
            message?.chat?.id!,
            "We will come back to you shortly!",
          );
          break;
        }
      }
    } catch (e) {
      LogsUtils.logError(String(e));
    }
  }

  private async _processMessage(
    chatId: number,
    username?: string,
    leadName?: string,
    messageText?: string,
    messageId?: number,
    fileId?: string,
    messageType?: MessageType,
  ) {
    try {
      switch (true) {
        case messageText === "/start": {
          const lb2 = await TemplateRepository.findByName("lb_2");
          this.sendMessage(
            chatId,
            lb2?.template_text!,
            lb2?.template_name!,
            JSON.parse(lb2?.tg_inline_keyboard!),
          );
          break;
        }
        case /\bbit2025\b/i.test(messageText || ""): {
          const after_code_bom =
            await TemplateRepository.findByName("after_code_bom");

          const nextBitDate = BookUtils.getNextBitDate();
          this._leadRepository.updateByTgChatId(chatId, {
            bit_text: BitStatus.BIT,
            bit_date: new Date(DateUtils.dateStringToDate(nextBitDate)),
          });
          this.sendMessage(
            chatId,
            after_code_bom?.template_text!,
            after_code_bom?.template_name!,
            undefined,
            undefined,
            [{ name: "slot", value: nextBitDate }],
          );
          break;
        }
        case /\bmike\b/i.test(messageText || ""): {
          const after_code_bit =
            await TemplateRepository.findByName("after_code_bit");

          const nextWgDate = BookUtils.getNextWg1Date();
          this._leadRepository.updateByTgChatId(chatId, {
            wg_text: WgStatus.WG1,
            wg_date: new Date(DateUtils.dateStringToDate(nextWgDate)),
          });
          this.sendMessage(
            chatId,
            after_code_bit?.template_text!,
            after_code_bit?.template_name!,
            undefined,
            undefined,
            [{ name: "slot", value: nextWgDate }],
          );
          break;
        }
        default:
          this._leadRepository.updateByTgChatId(chatId, {
            needs_attention: true,
          });
          break;
      }
    } catch (e) {
      LogsUtils.logError(String(e));
    }

    this._saveMessageToDb(
      MessageDirection.INCOMING,
      messageText,
      messageType!,
      messageId!,
      chatId,
      "",
      fileId,
    );

    let lead = !!username
      ? await this._leadRepository.findByTgUserName(username)
      : await this._leadRepository.findByTgChatId(chatId);

    if (!lead) {
      this._leadRepository.create({
        lead_name: leadName,
        channel: ChannelType.TELEGRAM,
        tg_chat_id: chatId,
        tg_username: username,
      });
    }
  }

  private async _saveMessageToDb(
    direction: MessageDirection,
    messageText: string | undefined,
    type: MessageType,
    mesId: number,
    chatId: number,
    templateName?: string,
    fileId?: string,
  ) {
    try {
      const messageData = {
        direction: direction,
        message_text: messageText,
        type: type,
        media_id: fileId,
        tg_id: mesId,
        tg_chat_id: chatId,
        template_name: templateName,
      };

      await MessagesRepository.create(messageData);

      // Notify connected clients about the new message (both incoming and outgoing)
      SocketUtils.notifyNewMessage(String(chatId), messageText);
    } catch (e) {
      LogsUtils.logError(String(e));
    }
  }

  async sendMessage(
    chatId: number,
    messageText: string,
    templateName?: string,
    inlineKeyboard?: TelegramBot.InlineKeyboardButton[][],
    keyboard?: TelegramBot.KeyboardButton[][],
    parameters?: { name: string; value: string }[],
  ) {
    try {
      const options: TelegramBot.SendMessageOptions = {};
      let messageTextWithParams = messageText;

      if (!!parameters) {
        parameters.forEach((param) => {
          messageTextWithParams = messageTextWithParams.replace(
            "{{" + param.name + "}}",
            param.value,
          );
        });
      }

      if (inlineKeyboard) {
        options.reply_markup = {
          inline_keyboard: inlineKeyboard,
        };
      } else if (keyboard) {
        options.reply_markup = {
          keyboard: keyboard,
          resize_keyboard: true,
          one_time_keyboard: false,
        };
      }

      const message = await this._bot.sendMessage(
        chatId,
        messageTextWithParams,
        options,
      );

      this._saveMessageToDb(
        MessageDirection.OUTGOING,
        messageTextWithParams,
        MessageType.TEXT,
        message.message_id,
        message.chat.id,
        templateName,
      );
    } catch (e) {
      LogsUtils.logError(String(e));
    }
  }
}

export default new TelegramUtils();
