import path from "path";
import { existsSync, createWriteStream, mkdirSync } from "fs-extra";
import { WriteStream } from "node:fs";
import { ILogsUtils } from "../typescript/interfaces";

class LogsUtils implements ILogsUtils {
  messageLogStream: WriteStream;
  accessLogStream: WriteStream;
  errorLogStream: WriteStream;

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), "logs");
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Create a write stream for access logs
    this.accessLogStream = createWriteStream(
      path.join(logsDir, "access.log"),
      { flags: "a" }, // 'a' means append (create if doesn't exist)
    );

    // Create a write stream for error logs
    this.errorLogStream = createWriteStream(path.join(logsDir, "error.log"), {
      flags: "a",
    });

    // Create a write stream for error logs
    this.messageLogStream = createWriteStream(
      path.join(logsDir, "message.log"),
      {
        flags: "a",
      },
    );
  }

  logMessage(message: string): void {
    const timestamp = new Date().toISOString();
    const messageToWrite = `[${timestamp}] MESSAGE: ${message}\n`;
    console.log(messageToWrite);
    this.messageLogStream.write(messageToWrite);
  }

  logError(message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? `\n${error.stack}` : "";
    const errorToWrite = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;
    console.error(errorToWrite);
    this.errorLogStream.write(errorToWrite);
  }

  closeStreams(): void {
    this.messageLogStream.end();
    this.accessLogStream.end();
    this.errorLogStream.end();
  }
}

export default new LogsUtils();
