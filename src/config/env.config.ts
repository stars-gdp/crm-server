import dotenv from "dotenv";
import { IConfig } from "../typescript/interfaces";
import { existsSync } from "fs-extra";
import path from "path";

class EnvConfig implements IConfig {
  PORT: number;
  WEBHOOK_VERIFY_TOKEN: string;

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

    if (process.env.NODE_ENV === "production") {
      if (!this.WEBHOOK_VERIFY_TOKEN) {
        throw new Error(
          "WEBHOOK_VERIFY_TOKEN must be set in production environment",
        );
      }
    }
  }
}

export default new EnvConfig();
