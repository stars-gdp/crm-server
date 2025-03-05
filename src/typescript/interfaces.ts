import { WriteStream } from "node:fs";

export interface IConfig {
  PORT: number;
  WEBHOOK_VERIFY_TOKEN: string;
}

export interface ILogsUtils {
  messageLogStream: WriteStream;
  accessLogStream: WriteStream;
  errorLogStream: WriteStream;
  logMessage(message: string): void;
  logError(message: string, error?: Error): void;
  closeStreams(): void;
}
