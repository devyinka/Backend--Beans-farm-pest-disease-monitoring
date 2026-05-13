import dotenv from "dotenv";
import http from "http";
import app from "./config/app";
import connectDB from "./config/mongodb";
import initializeSocket from "./Socket";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);

const handleServerError = (error: NodeJS.ErrnoException): void => {
  // Handle common startup errors with clear guidance.
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running process on that port or change PORT in backend/.env.`,
    );
    process.exit(1);
  }

  if (error.code === "EACCES") {
    console.error(`Permission denied while trying to bind to port ${PORT}.`);
    process.exit(1);
  }

  console.error("Unhandled server startup error:", error);
  process.exit(1);
};

const bootstrap = async (): Promise<void> => {
  // Connect to MongoDB before accepting incoming requests.
  await connectDB();

  // Create one HTTP server and attach both Express and Socket.IO to it.
  const server = http.createServer(app);
  initializeSocket(server);

  // Attach server-level error handling before listen.
  server.on("error", handleServerError);

  server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });

  // Graceful shutdown helps avoid abrupt connection drops.
  const shutdown = (signal: string) => {
    console.info(`${signal} received. Shutting down backend server...`);
    server.close(() => {
      console.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

bootstrap().catch((error) => {
  console.error("Failed to start backend server:", error);
  process.exit(1);
});
