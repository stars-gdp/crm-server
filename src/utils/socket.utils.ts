import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import LogsUtils from "./logs.utils";

class SocketUtils {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.IO with the HTTP server
   * @param server HTTP server instance
   */
  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*", // Configure as needed
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket) => {
      const clientId = socket.id;
      LogsUtils.logMessage(`Client connected: ${clientId}`);

      // Handle client subscription to specific lead's messages
      socket.on("subscribe-to-lead", (leadPhone: string) => {
        socket.join(`lead:${leadPhone}`);
        LogsUtils.logMessage(
          `Client ${clientId} subscribed to lead: ${leadPhone}`,
        );
      });

      // Handle client unsubscription
      socket.on("unsubscribe-from-lead", (leadPhone: string) => {
        socket.leave(`lead:${leadPhone}`);
        LogsUtils.logMessage(
          `Client ${clientId} unsubscribed from lead: ${leadPhone}`,
        );
      });

      socket.on("disconnect", () => {
        LogsUtils.logMessage(`Client disconnected: ${clientId}`);
      });
    });

    LogsUtils.logMessage("Socket.IO initialized");
  }

  /**
   * Notify clients when a new message is sent or received
   * @param leadPhone Lead's phone number
   * @param message Message data
   */
  notifyNewMessage(leadPhone: string, message: any): void {
    if (!this.io) {
      LogsUtils.logError("Socket.IO not initialized");
      return;
    }

    // Emit to all clients subscribed to this lead
    this.io.to(`lead:${leadPhone}`).emit("new-message", message);

    // Also emit a general notification that can be used to update lead lists
    this.io.emit("message-activity", { leadPhone, timestamp: new Date() });

    LogsUtils.logMessage(
      `Socket notification sent for new message to ${leadPhone}`,
    );
  }
}

export default new SocketUtils();
