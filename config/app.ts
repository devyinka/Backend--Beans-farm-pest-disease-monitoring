import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../middleware/errorHandler";
import registerRouter from "../Routes/Register";
import loginRouter from "../Routes/login";
import savesensordata from "../Routes/rawSensor";
import { getAllowedOrigins } from "./origins";
import alertHistoryRouter from "../Routes/alertHistory";
import getUIRouter from "../Routes/getUI";
const app = express();

// Configure CORS so the frontend and approved device origins can communicate safely.
const allowedOrigins = new Set(getAllowedOrigins());

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

app.use(
  cors({
    origin: [
      "https://wokwi.com",
      "http://localhost:3000",
      "https://wokwi.com/projects/460235036009124865",
    ], // Allows Wokwi and your Next.js app
    methods: ["GET", "POST", "PUT", "DELETE"],
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

// Register application routes.
app.use("/auth", registerRouter);
app.use("/auth", loginRouter);
app.use("/sensor", savesensordata);
app.use("/alert", alertHistoryRouter);
app.use("/ui", getUIRouter);
// Handle unknown routes with a clear API response.
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Keep this last so all thrown errors are normalized here.
app.use(errorHandler);

export default app;
