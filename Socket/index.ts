import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getAllowedOrigins } from "../config/origins";
import { registerFarmNamespace } from "./namespace/farm.namespace";

const getAllowedOrigin = (): string[] => {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.length > 0 ? allowedOrigins : ["http://localhost:3000"];
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

  registerFarmNamespace(io);

  return io;
};

export default initializeSocket;
