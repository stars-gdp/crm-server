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
  WG1 = "WG1",
  WG2 = "WG2",
  WG3 = "WG3",
  NotInterested = "Not Interested",
}

export enum MessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}
