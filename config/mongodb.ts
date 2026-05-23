import mongoose from "mongoose";
import { startAggregationJobs } from "../utility/schedule";

const parseBoolean = (value?: string): boolean => {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
};

const isMongoRequired = (): boolean => {
  // Production should fail fast if DB is unavailable.
  // In development, DB can be optional unless explicitly required.
  if (process.env.MONGODB_REQUIRED !== undefined) {
    return parseBoolean(process.env.MONGODB_REQUIRED);
  }

  return process.env.NODE_ENV === "production";
};

const getMongoHostForHint = (uri: string): string | undefined => {
  // Best-effort extraction of host without leaking credentials.
  // Works for both mongodb:// and mongodb+srv:// URIs.
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?#]+)/i);
  return match?.[1];
};

const connectDB = async (): Promise<void> => {
  // Read MongoDB connection string from environment variables.
  const uri = process.env.MONGODB_URI;
  const required = isMongoRequired();

  if (!uri) {
    if (required) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    console.warn(
      "MONGODB_URI is not defined. Continuing without MongoDB because MONGODB_REQUIRED is false.",
    );
    return;
  }

  // Avoid creating duplicate connections in watch/hot-reload scenarios.
  if (mongoose.connection.readyState === 1) {
    console.info("MongoDB already connected.");
    return;
  }

  try {
    // Establish connection with sensible defaults.
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== "production",
    });
    //this is where we start the aggregation jobs after the database connection is established. This ensures that the jobs have access to the database and can run without issues.
    startAggregationJobs();

    console.info("MongoDB connected successfully.");
  } catch (error) {
    const hostHint = uri ? getMongoHostForHint(uri) : undefined;
    const baseHint =
      "MongoDB connection failed. If you use Atlas, confirm Network Access allows your egress IP and that your network allows outbound TCP to MongoDB (default port 27017).";

    const portHint = hostHint
      ? ` Quick check from this machine: \`timeout 5 bash -lc '</dev/tcp/${hostHint}/27017'\`.`
      : "";

    const hint = `${baseHint}${portHint} Error details: ${String(error)}`;

    if (required) {
      console.error(hint);
      throw error;
    }

    console.warn(
      `${hint} Continuing without MongoDB because MONGODB_REQUIRED is false.`,
    );
  }
};

export default connectDB;
