import mongoose from "mongoose";

const AIpredictionSchema = new mongoose.Schema({
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  machine_location: {
    type: String,
    required: true,
  },
  time_of_day: {
    type: String,
    enum: ["morning", "evening"],
    required: true,
  },

  // --- CROP STATUS ---
  beans_status: {
    beans_planting_date: {
      type: Date,
      required: true,
    },
    beans_growth_stage: {
      type: String,
      enum: ["seedling", "vegetative", "flowering", "pod fill", "harvest"],
      required: true,
    },
  },

  //The 24-Hour Snapshot (The Current Data)
  todays_sensor_averages: {
    max_temp_c: { type: Number, default: 0 },
    min_temp_c: { type: Number, default: 0 },
    avg_day_hum_percent: { type: Number, default: 0 },
    avg_night_hum_percent: { type: Number, default: 0 },
    soil_moisture_percent: { type: Number, default: 0 },
    sunlight_hours: { type: Number, default: 0 },
    rain_level_mm: { type: Number, default: 0 },

    /// --- THE 24-HOUR CUMULATIVE DATA (The Stress Indicators) ---
    leaf_wetness_hours: { type: Number, default: 0 },
    cumulative_stress_index: { type: Number, default: 0 },
  },

  // --- THE 10-DAY TREND DATA (The Historical Context) ---
  the_10_days_past_weather: {
    total_hot_days_past_10_days: { type: Number, default: 0 },
    total_wet_nights_past_10_days: { type: Number, default: 0 },
    total_dry_soil_days_past_10_days: { type: Number, default: 0 },
    total_flooded_days_past_10_days: { type: Number, default: 0 },
    total_rainy_days_past_10_days: { type: Number, default: 0 },
    total_rain_volume_mm_past_10_days: { type: Number, default: 0 },
  },

  // --- THE AI PREDICTION (Python's Output) ---
  ai_result: {
    farm_status: {
      type: String,
    },
    prediction: {
      type: String,
      required: true,
    },
    confidence_percentage: {
      type: Number,
      required: true,
    },
  },
});

export default mongoose.model("AIPrediction", AIpredictionSchema);
