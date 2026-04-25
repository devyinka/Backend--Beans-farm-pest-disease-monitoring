import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const getAllowedOrigin = (): string => {
  // Allow frontend origin from env, fallback to local Next.js default.
  return process.env.FRONTEND_URL ?? "http://localhost:3000";
};

export const initializeSocket = (server: HttpServer): SocketIOServer => {
  // Socket.IO server uses same HTTP server as Express.
  const io = new SocketIOServer(server, {
    cors: {
      origin: getAllowedOrigin(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Simple heartbeat event to verify live socket communication.
    socket.on("ping", () => {
      socket.emit("pong", { at: new Date().toISOString() });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export default initializeSocket;
