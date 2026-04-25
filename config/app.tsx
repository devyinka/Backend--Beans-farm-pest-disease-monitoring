import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../middleware/errorHandler";

const app = express();

// Configure CORS so the frontend can communicate with the backend safely.
const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Basic security headers (helmet) and gzip compression for better performance.
app.use(helmet());
app.use(compression());

// Request logging in development for easier debugging.
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Parse incoming cookies and JSON/form bodies.
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Cross-origin access policy for frontend app.
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

// Small global rate limiter to reduce abuse in a default setup.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/", (_req, res) => {
  res.json({
    message: "Backend server is running.",
    socketReady: true,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Handle unknown routes with a clear API response.
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Keep this last so all thrown errors are normalized here.
app.use(errorHandler);

export default app;
