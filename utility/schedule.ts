import cron from "node-cron";
import { runAggregate } from "./dailyAggregationJob.js";
import configuration from "../Models/configuration";

// This file sets up the scheduled aggregation jobs that run every morning and evening. It uses node-cron to schedule the tasks and pulls the latest configuration for each farm to ensure the aggregation runs with the correct parameters. The actual aggregation logic is handled in dailyAggregationJob.ts, which is called by these scheduled tasks.
export function startAggregationJobs() {
  // ── MORNING JOB — 6:00 AM every day ──────────────────────────────────────
  cron.schedule(
    "0 6 * * *",
    async () => {
      console.log(
        "\n[Cron] ☀ Morning aggregation started —",
        new Date().toISOString(),
      );

      const configs = await configuration.find({}).lean();

      if (configs.length === 0) {
        console.warn("[Cron] No configurations found — no aggregation to run");
        return;
      }

      for (const config of configs) {
        await runAggregate(config.machine_location, "morning");
      }
    },
    { timezone: "Africa/Lagos" },
  );

  // ── EVENING JOB — 6:00 PM every day ──────────────────────────────────────
  cron.schedule(
    "0 18 * * *",
    async () => {
      console.log(
        "\n[Cron] 🌙 Evening aggregation started —",
        new Date().toISOString(),
      );

      const configs = await configuration.find({}).lean();

      if (configs.length === 0) {
        console.warn("[Cron] No configurations found — no aggregation to run");
        return;
      }

      for (const config of configs) {
        await runAggregate(config.machine_location, "evening");
      }
    },
    { timezone: "Africa/Lagos" },
  );

  console.log("[Cron] ✅ Aggregation jobs registered:");
  console.log("         Morning  → 6:00 AM WAT daily");
  console.log("         Evening  → 6:00 PM WAT daily");
}
