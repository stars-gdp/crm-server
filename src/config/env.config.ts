import dotenv from "dotenv";
import { IConfig } from "../typescript/interfaces";
import { existsSync } from "fs-extra";
import path from "path";

class EnvConfig implements IConfig {
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

  private loadDotEnv(): void {
    const envFile = process.env.NODE_ENV
      ? `${process.env.NODE_ENV}.env`
      : ".env";
    const envPath = path.resolve(process.cwd(), envFile);

    dotenv.config({ path: envPath });
    if (!existsSync(envPath)) {
      console.warn(
        `Warning: ${envFile} file not found. Using default environment variables.`,
      );
    }
  }

  constructor() {
    this.loadDotEnv();

    this.PORT = parseInt(process.env.PORT || "3000", 10);
    this.WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "";
    this.GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN || "";
    this.PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "";
    this.WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";

    // Database configuration
    this.DATABASE_URL = process.env.DATABASE_URL || "localhost";
    this.DATABASE_PORT = parseInt(process.env.DATABASE_PORT || "3306", 10);
    this.DATABASE_USER = process.env.DATABASE_USER || "crm";
    this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || "";
    this.DATABASE_NAME = process.env.DATABASE_NAME || "gdp";

    if (process.env.NODE_ENV === "production") {
      if (!this.WEBHOOK_VERIFY_TOKEN) {
        throw new Error(
          "WEBHOOK_VERIFY_TOKEN must be set in production environment",
        );
      }

      // Validate database configuration in production
      if (!this.DATABASE_NAME) {
        throw new Error("DB_PASSWORD must be set in production environment");
      }
    }
  }
}

export default new EnvConfig();
