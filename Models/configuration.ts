import mongoose from "mongoose";

interface ConfigurationDoc {
  __id: number;
  machine_location: string;
  BeanPlantingDate: Date;
  aiConfidence: number;
  sensorPollingRateMinutes: number;
  luxThreshold: number;
  hotDayTempThreshold: number;
  wetNightHumThreshold: number;
  drySoilThreshold: number;
  floodedSoilThreshold: number;
  updatedAt?: Date;
}

const ConfigurationSchema = new mongoose.Schema<ConfigurationDoc>({
  __id: {
    type: Number,
    unique: true,
  },

  // Which farm location this config belongs to
  machine_location: {
    type: String,
    required: true,
    unique: true,
    // Must match the machine_location in Rawsensors and DailyAggregate
  },

  // ── BEAN PLANTING INFO ────────────────────────────────────────────
  // Set this ONCE when you plant. Age is then auto-calculated forever.
  BeanPlantingDate: {
    type: Date,
    required: true,
    // Example: new Date("2025-03-01")
    // Node.js will calculate age as:
    //   Math.floor((Date.now() - config.BeanPlantingDate) / 86400000)
  },

  // ── AI MODEL SETTINGS ─────────────────────────────────────────────
  aiConfidence: {
    type: Number,
    required: true,
    default: 70,
    // Minimum confidence % before an SMS alert is sent to the farmer
    // If model returns 65% confidence but threshold is 70% → no SMS
    // Recommended: 70–80% for production
  },

  // ── SENSOR SETTINGS ───────────────────────────────────────────────
  sensorPollingRateMinutes: {
    type: Number,
    required: true,
    default: 30,
    // How often the ESP32 reads and sends data (in minutes)
    // Recommended: 30 minutes
    // Affects readings_count in DailyAggregate:
    //   30 min polling → 24 readings per 12-hour window
    //   15 min polling → 48 readings per 12-hour window
  },

  luxThreshold: {
    type: Number,
    required: true,
    default: 10000,
    // LDR reading (in lux) that counts as "sunlight is adequate"
    // Used to calculate sunlight_hours:
    //   readings where lightLevel > luxThreshold × 0.5 = sunlight_hours
    // 10,000 lux ≈ full outdoor daylight in Nigeria
  },

  // ── STREAK THRESHOLDS ─────────────────────────────────────────────
  // These define what counts as a "hot day", "wet night" etc.
  // for the 10-day historical trend calculation

  hotDayTempThreshold: {
    type: Number,
    default: 32,
    // max_temp_c > this → counts as a hot day
  },

  wetNightHumThreshold: {
    type: Number,
    default: 85,
    // avg_night_hum_percent > this → counts as a wet night
  },

  drySoilThreshold: {
    type: Number,
    default: 30,
    // soil_moisture_percent < this → counts as a dry soil day
  },

  floodedSoilThreshold: {
    type: Number,
    default: 90,
    // soil_moisture_percent > this → counts as a flooded day
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ConfigurationDoc>(
  "Configuration",
  ConfigurationSchema,
);
