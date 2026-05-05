import mongoose from "mongoose";
import AutoincrementFactory from "mongoose-sequence";

const Autoincrement = AutoincrementFactory(mongoose);

/**
 * DailyAggregate Schema
 *
 * This collection is the BRIDGE between raw sensor readings (Rawsensors)
 * and the AI prediction model (FastAPI).
 *
 * Created TWICE per day by the aggregation cron job:
 *   → 6:00 AM  → time_of_day: "morning"  (covers 6PM yesterday → 6AM today)
 *   → 6:00 PM  → time_of_day: "evening"  (covers 6AM today    → 6PM today)
 *
 * After saving, the cron job immediately calls FastAPI with this document
 * and saves the AI result to the AIPrediction collection.
 */
const DailyAggregateSchema = new mongoose.Schema({
  __id: {
    type: Number,
    unique: true,
  },

  // Which ESP32 device produced this aggregate
  machine_location: {
    type: String,
    required: true,
    index: true,
  },

  // The calendar date this aggregate belongs to
  date: {
    type: Date,
    required: true,
    index: true,
  },

  // Which of the two daily readings this is
  time_of_day: {
    type: String,
    enum: ["morning", "evening"],
    required: true,
  },

  // ── TODAY'S SENSOR AVERAGES ──────────────────────────────────────────────
  // Computed from Rawsensors readings in the relevant 12-hour window

  max_temp_c: {
    type: Number,
    required: true,
    // Morning: highest temp from 6PM–6AM (night max, typically 18–27°C)
    // Evening: highest temp from 6AM–6PM (day peak, typically 24–40°C)
  },

  min_temp_c: {
    type: Number,
    required: true,
    // Coldest reading in the 12-hour window
  },

  avg_day_hum_percent: {
    type: Number,
    required: true,
    default: 0,
    // Morning: always 0 — daytime has not started yet
    // Evening: average of all humidity readings from 6AM–6PM
  },

  avg_night_hum_percent: {
    type: Number,
    required: true,
    // Morning: average humidity from 6PM (yesterday) → 6AM (today) — fresh reading
    // Evening: same value as morning — refers to last night (does not change mid-day)
  },

  soil_moisture_percent: {
    type: Number,
    required: true,
    // Average of all soil moisture readings in the window
    // Morning: slightly higher from overnight (no evaporation)
    // Evening: slightly lower (sun and heat dry the soil)
  },

  soil_ph: {
    type: Number,
    required: true,
    // Average of all pH readings — stable, rarely changes
  },

  sunlight_hours: {
    type: Number,
    required: true,
    default: 0,
    // Morning: always 0.0 — sun is not out at 6AM
    // Evening: count of readings where lightLevel > 10000 lux, multiplied by 0.5
    //          (each reading covers 30 minutes = 0.5 hours)
  },

  rain_level_mm: {
    type: Number,
    required: true,
    default: 0,
    // Morning: total rain that fell from 6PM (yesterday) → 6AM (today) — overnight rain
    // Evening: total rain that fell from 6AM → 6PM today — full daytime rain
  },

  leaf_wetness_hours: {
    type: Number,
    required: true,
    default: 0,
    // Computed — see aggregation logic in dailyAggregation.job.ts
    // Morning: usually higher due to overnight dew and night humidity
    // Evening: usually lower — daytime sun dries the leaves
  },

  cumulative_stress_index: {
    type: Number,
    required: true,
    default: 0,
    // Weighted score of stress conditions in the window
    // Formula: (hot_days×0.3) + (wet_nights×0.25) + (dry_soil×0.25) + (rain×0.1) + (flood×0.1)
  },

  // ── 10-DAY HISTORICAL TREND ──────────────────────────────────────────────
  // Looked up by counting past 10 DailyAggregate evening records
  // These values are the SAME for both morning and evening on the same day
  // (10-day window only shifts at midnight)

  hot_days_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Days in past 10 where max_temp_c > 32°C
  },

  wet_nights_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Days in past 10 where avg_night_hum_percent > 85%
  },

  dry_soil_days_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Days in past 10 where soil_moisture_percent < 30%
  },

  flooded_days_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Days in past 10 where soil_moisture_percent > 90%
  },

  rainy_days_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Days in past 10 where rain_level_mm > 0
  },

  total_rain_volume_mm_past_10_days: {
    type: Number,
    required: true,
    default: 0,
    // Sum of all rain_level_mm from past 10 evening records
  },

  // ── BEAN STATUS ──────────────────────────────────────────────────────────
  // Read from Configuration at the time the cron job runs

  plant_age_days: {
    type: Number,
    required: true,
    // Calculated as: Math.floor((Date.now() - config.BeanPlantingDate) / 86400000)
    // This means you NEVER need to manually update the age — it is automatic
  },

  growth_stage: {
    type: String,
    enum: ["seedling", "vegetative", "flowering", "pod fill", "harvest"],
    required: true,
    // Derived from plant_age_days:
    //   1–14  → seedling
    //   15–35 → vegetative
    //   36–55 → flowering
    //   56–70 → pod fill
    //   71+   → harvest
  },

  // ── META ─────────────────────────────────────────────────────────────────

  readings_count: {
    type: Number,
    required: true,
    // How many Rawsensors documents were used to compute this aggregate
    // Expected: ~24 (every 30 min over 12 hours)
    // If this is < 10, the aggregate may be unreliable (sensor was offline)
  },

  // Set to true after FastAPI has been called and AIPrediction saved
  ai_prediction_sent: {
    type: Boolean,
    default: false,
  },

  // Reference to the AIPrediction document created from this aggregate
  ai_prediction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AIPrediction",
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: one aggregate per location per date per time_of_day
DailyAggregateSchema.index(
  { machine_location: 1, date: 1, time_of_day: 1 },
  { unique: true },
);

DailyAggregateSchema.plugin(Autoincrement, {
  id: "dailyaggregate_seq",
  inc_field: "__id",
});

export default mongoose.model("DailyAggregate", DailyAggregateSchema);
