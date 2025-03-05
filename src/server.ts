import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import EnvConfig from "./config/env.config";
import LogsUtils from "./utils/logs.utils";

// Initialize Express app
const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up logging based on environment
if (process.env.NODE_ENV === "production") {
  // In production, log to files
  app.use(morgan("combined", { stream: LogsUtils.accessLogStream }));
} else {
  // In development, log to console and file
  app.use(morgan("dev")); // Console output with colors
  app.use(morgan("common", { stream: LogsUtils.accessLogStream }));
}

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const errorMessage = `${req.method} ${req.url} - ${err.stack}\n`;
    LogsUtils.logError(errorMessage);
    next(err);
  },
);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Main routes
app.get("/", (req, res) => {
  res.sendStatus(403);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === EnvConfig.WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    LogsUtils.logMessage("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    LogsUtils.logError(err.stack || "Unknown error");
    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  },
);

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(EnvConfig.PORT, () => {
  LogsUtils.logMessage(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${EnvConfig.PORT}`,
  );
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  LogsUtils.logMessage("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    LogsUtils.logMessage("HTTP server closed");
    LogsUtils.closeStreams();
    process.exit(0);
  });
});

export default app;
