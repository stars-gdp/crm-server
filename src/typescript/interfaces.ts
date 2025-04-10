import { WriteStream } from "node:fs";

export interface IConfig {
  PORT: number;
  WEBHOOK_VERIFY_TOKEN: string;
  GRAPH_API_TOKEN: string;
  PHONE_NUMBER_ID: string;
  WHATSAPP_API_URL: string;
  DATABASE_URL: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
}

export interface ILogsUtils {
  messageLogStream: WriteStream;
  accessLogStream: WriteStream;
  errorLogStream: WriteStream;
  logMessage(message: string): void;
  logError(message: string, error?: Error): void;
  closeStreams(): void;
}

export interface IWhatsAppMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

export interface ITemplateMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components: any[];
  };
}

export interface ITemplate {
  name: string;
  parameters?: ITemplateParameter[];
}

export interface ITemplateParameter {
  parameter_name: string;
  type: string;
  text?: string;
}

export interface IFBTemplate {
  data: IFBTemplateData[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface IFBTemplateData {
  name: string;
  components: IFBTemplateComponent[];
  language: string;
  status: FBTemplateStatus;
  category: string;
  sub_category: string;
  id: string;
}

export interface IFBTemplateComponent {
  type: string;
  text?: string;
  buttons?: IFBTemplateButton[];
}

export interface IFBTemplateButton {
  type: string;
  text: string;
}

export enum FBTemplateStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export enum BomStatus {
  BOM = "BOM",
  NotInterested = "Not Interested",
  Show = "Show",
}
export enum BitStatus {
  BIT = "BIT",
  NotInterested = "Not Interested",
  Show = "Show",
}
export enum PtStatus {
  PT = "PT",
  NotInterested = "Not Interested",
  Show = "Show",
}
export enum WgStatus {
  Code = "code",
  WG1 = "WG 1",
  WG2 = "WG 2",
  WG3 = "WG 3",
  NotInterested = "Not Interested",
}

export enum MessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

export enum MessageType {
  BUTTON = "button",
  IMAGE = "image",
  VIDEO = "video",
  REACTION = "reaction",
  TEXT = "text",
}

export enum LinkType {
  BOM = "BOM",
  BIT = "BIT",
  WG = "WG",
}
export enum ChannelType {
  WHATSAPP = "WhatsApp",
  TELEGRAM = "Telegram",
}
