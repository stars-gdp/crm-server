import { DataSource } from "typeorm";
import path from "path";
import EnvConfig from "./env.config";
import LogsUtils from "../utils/logs.utils";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: EnvConfig.DATABASE_URL,
  port: EnvConfig.DATABASE_PORT,
  username: EnvConfig.DATABASE_USER,
  password: EnvConfig.DATABASE_PASSWORD,
  database: EnvConfig.DATABASE_NAME,
  synchronize: process.env.NODE_ENV !== "production", // Auto-create tables in development
  logging: process.env.NODE_ENV !== "production",
  entities: [path.join(__dirname, "../entities/**/*.entity{.ts,.js}")],
  migrations: [path.join(__dirname, "../migrations/**/*{.ts,.js}")],
  subscribers: [path.join(__dirname, "../subscribers/**/*{.ts,.js}")],
  connectTimeout: 30000,
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    LogsUtils.logMessage("Data Source has been initialized!");
    return AppDataSource;
  } catch (error) {
    LogsUtils.logError(
      "Error during Data Source initialization",
      error as Error,
    );
    throw error;
  }
};
