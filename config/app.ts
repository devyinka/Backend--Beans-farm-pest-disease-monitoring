import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import registerRouter from "../Routes/Register";
import loginRouter from "../Routes/login";
import savesensordata from "../Routes/rawSensor";
import { getAllowedOrigins } from "./origins";
import alertHistoryRouter from "../Routes/alertHistory";
import getUIRouter from "../Routes/getUI";
import updateESP32andAIRouter from "../Routes/updateESP32&AI";
import { getSensorPollingRateRouter } from "../Routes/updateESP32&AI";
import { beanPlantingDateRouter } from "../Routes/beansplantingdate";
import { updateBeanPlantingDateRouter } from "../Routes/beansplantingdate";
import testingRouter from "../Routes/Testing";
import sprayingRouter from "../Routes/spraying";

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

const allowedOrigin = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

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

// public routes
app.use("/auth", registerRouter);
app.use("/auth", loginRouter);
app.use("/sensor", savesensordata);
app.use("/alert", alertHistoryRouter);
app.use("/UIStatus", getUIRouter);
app.use("/get", getSensorPollingRateRouter);
// protected routes - require valid JWT token
app.use(authenticate);
app.use("/Device", updateESP32andAIRouter);
app.use("/get", beanPlantingDateRouter);
app.use("/update", updateBeanPlantingDateRouter);
app.use("/test", testingRouter);
app.use("/spraying", sprayingRouter);

//hanle unknown routes
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Keep this last so all thrown errors are normalized here.
app.use(errorHandler);

export default app;
