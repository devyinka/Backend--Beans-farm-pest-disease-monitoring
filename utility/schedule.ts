
import cron from "node-cron"
import { runAggregate } from "./dailyAggregationJob.js";
import configuration from "../Models/configuration";

// ════════════════════════════════════════════════════════════════════════════
//  MAIN: Register cron jobs
//
//  Runs for EVERY machine_location in the Configuration collection.
//  This means if I add a second ESP32 device, I just add a new
//  Configuration document — no code changes needed.
//
//  Schedule:
//    Morning → 6:00 AM every day  (cron: "0 6 * * *")
//    Evening → 6:00 PM every day  (cron: "0 18 * * *")
//
//  Timezone: Africa/Lagos (WAT = UTC+1)
// ════════════════════════════════════════════════════════════════════════════

export function startAggregationJobs()
{
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
