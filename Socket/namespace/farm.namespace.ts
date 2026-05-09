import type { Namespace, Server as SocketIOServer, Socket } from "socket.io";

let farmNamespace: Namespace | null = null;

// Register the farm namespace and set up event handlers for client connections.
export const registerFarmNamespace = (io: SocketIOServer): Namespace => {
  farmNamespace = io.of("/");

  farmNamespace.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join:farm", (machineLocation: string) => {
      if (machineLocation) {
        // Group sockets by farm location so future targeted emits stay simple.
        socket.join(machineLocation);
      }
    });

    // Lightweight heartbeat for the frontend and for manual debugging.
    socket.on("ping", () => {
      socket.emit("pong", { at: new Date().toISOString() });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return farmNamespace;
};

export const getFarmNamespace = (): Namespace | null => farmNamespace;
