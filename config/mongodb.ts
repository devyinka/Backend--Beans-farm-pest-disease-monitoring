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
    startAggregationJobs();
    console.info("MongoDB connected successfully.");
  } catch (error) {
    const hint =
      "MongoDB connection failed. If you use Atlas, whitelist your current IP in Network Access.";

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
