import axios from "axios";
import Rawsensors from "../Models/Rawsensors";
import DailyAggregate from "../Models/dailyAggregate";
import Configuration from "../Models/configuration";
import AIprediction from "../Models/AIprediction";
import { getBeansGrowthStage } from "../helper/dailaggregation";
import { calcLeafWetnessHours } from "../helper/dailaggregation";
import { get10DaysTrend } from "../helper/dailaggregation";
import { calcSunlightHours } from "../helper/dailaggregation";
import { calcStressIndex } from "../helper/dailaggregation";
import { sendFarmAlert } from "./smsAlert";
import { ALERTHISTORYSERVICE } from "../Services/alertHistoryService";

// environment
const FAST_API_URL = process.env.FAST_API_URL;

export const runAggregate = async (
  machineLocation: string,
  timeOfDay: "morning" | "evening",
) => {
  let Health_status: string;
  let Prediction: string;
  let Confidence_percentage: number;

  try {
    const config = await Configuration.findOne({
      machine_location: machineLocation,
    }).lean();
    if (!config) {
      console.error(
        `[Aggregation] No config found for ${machineLocation} — skipping`,
      );
      return;
    }
    const now = new Date();

    //  Morning window: 6PM yesterday → 6AM today  (captures overnight)
    //  Evening window: 6AM today    → 6PM today   (captures daytime)
    let windowStart: Date;
    let windowEnd: Date;

    if (timeOfDay === "morning") {
      windowEnd = new Date(now);
      windowEnd.setHours(6, 0, 0, 0); // 6:00 AM today

      windowStart = new Date(windowEnd);
      windowStart.setDate(windowStart.getDate() - 1);
      windowStart.setHours(18, 0, 0, 0); // 6:00 PM yesterday
    } else {
      windowStart = new Date(now);
      windowStart.setHours(6, 0, 0, 0); // 6:00 AM today

      windowEnd = new Date(now);
      windowEnd.setHours(18, 0, 0, 0); // 6:00 PM today
    }

    // ── STEP 3: Fetch raw sensor readings ──────────────────────────────────
    const readings = await Rawsensors.find({
      machine_location: machineLocation,
      timeStamp: { $gte: windowStart, $lte: windowEnd },
    }).lean();

    if (readings.length === 0) {
      console.warn(
        `[Aggregation] No readings found for ${machineLocation} in window — skipping`,
      );
      return;
    }

    console.log(
      `[Aggregation] Found ${readings.length} raw readings in window`,
    );

    // ── STEP 4: Extract temperature readings ───────────────────────────────
    const temps = readings.map((r) => r.temperature);
    const maxTempC = Math.round(Math.max(...temps) * 10) / 10;
    const minTempC = Math.round(Math.min(...temps) * 10) / 10;

    // ── STEP 5: Humidity averages ──────────────────────────────────────────
    //  Morning: all readings are night → avg_day = 0, avg_night = avg of all
    //  Evening: split readings by hour → day = 6AM–6PM, night = from yesterday
    let avgDayHum = 0;
    let avgNightHum = 0;

    if (timeOfDay === "morning") {
      // All readings in morning window are night readings
      avgDayHum = 0;
      const allHums = readings.map((r) => r.humidity);
      avgNightHum =
        Math.round((allHums.reduce((a, b) => a + b, 0) / allHums.length) * 10) /
        10;
    } else {
      // Evening: all readings are daytime (6AM–6PM)
      const dayHums = readings.map((r) => r.humidity);
      avgDayHum =
        Math.round((dayHums.reduce((a, b) => a + b, 0) / dayHums.length) * 10) /
        10;

      // For avg_night_hum in evening: look up this morning's aggregate
      const morningAggregate = await DailyAggregate.findOne({
        machine_location: machineLocation,
        time_of_day: "morning",
        date: {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lt: new Date(now.setHours(23, 59, 59, 999)),
        },
      }).lean();

      // Use this morning's night humidity if available, else compute from readings
      avgNightHum = morningAggregate
        ? morningAggregate.avg_night_hum_percent
        : avgDayHum; // fallback
    }

    // ── STEP 6: Soil moisture and pH ───────────────────────────────────────
    const soilMoistureValues = readings.map((r) => r.soil_moisture);

    const avgSoilMoisture =
      Math.round(
        (soilMoistureValues.reduce((a, b) => a + b, 0) /
          soilMoistureValues.length) *
          10,
      ) / 10;

    // ── STEP 7: Rain level ─────────────────────────────────────────────────
    //  Sum all rain readings in the window
    const totalRainMm =
      Math.round(
        readings.reduce((sum, r) => sum + (r.rain_level || 0), 0) * 10,
      ) / 10;

    // ── STEP 8: Sunlight hours ─────────────────────────────────────────────
    const sunlightHours = calcSunlightHours(
      readings,
      config.luxThreshold,
      timeOfDay,
      config.sensorPollingRateMinutes,
    );

    // ── STEP 9: 10-day historical trend ────────────────────────────────────
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const trend = await get10DaysTrend(machineLocation, today, config);

    // ── STEP 10: Leaf wetness hours ────────────────────────────────────────
    const leafWetnessHours = calcLeafWetnessHours(
      readings,
      avgNightHum,
      trend.wet_nights_past_10_days,
      config.luxThreshold,
    );

    // ── STEP 11: Cumulative stress index ───────────────────────────────────
    const cumulativeStressIndex = calcStressIndex(
      trend.hot_days_past_10_days,
      trend.wet_nights_past_10_days,
      trend.dry_soil_days_past_10_days,
      trend.rainy_days_past_10_days,
      trend.flooded_days_past_10_days,
    );

    // ── STEP 12: Bean status ───────────────────────────────────────────────
    const plantAgeDays = Math.floor(
      (Date.now() - new Date(config.BeanPlantingDate).getTime()) / 86400000,
    );
    const growthStage = getBeansGrowthStage(plantAgeDays);

    // ── STEP 13: Build the aggregate document ──────────────────────────────
    const aggregateData = {
      machine_location: machineLocation,
      date: today,
      time_of_day: timeOfDay,

      // Sensor averages
      max_temp_c: maxTempC,
      min_temp_c: minTempC,
      avg_day_hum_percent: avgDayHum,
      avg_night_hum_percent: avgNightHum,
      soil_moisture_percent: avgSoilMoisture,
      sunlight_hours: sunlightHours,
      rain_level_mm: totalRainMm,
      leaf_wetness_hours: leafWetnessHours,
      cumulative_stress_index: cumulativeStressIndex,

      // 10-day trend
      ...trend,

      // Bean status
      plant_age_days: plantAgeDays,
      growth_stage: growthStage,

      // Meta
      readings_count: readings.length,
      ai_prediction_sent: false,
      ai_prediction_id: null,
    };

    // ── STEP 14: Save DailyAggregate to MongoDB ────────────────────────────
    const saved = await DailyAggregate.findOneAndUpdate(
      {
        machine_location: machineLocation,
        date: today,
        time_of_day: timeOfDay,
      },
      aggregateData,
      { upsert: true, new: true },
    );

    console.log(`[Aggregation] DailyAggregate saved — ID: ${saved._id}`);

    // ── STEP 15: Build FastAPI payload ─────────────────────────────────────
    //  Field names must match the training dataset column names exactly
    const fastApiPayload = {
      Time_of_Day: timeOfDay,
      Plant_Age_Days: plantAgeDays,
      Growth_Stage: growthStage,
      Max_Temp_C: maxTempC,
      Min_Temp_C: minTempC,
      "Avg_Day_Hum_%": avgDayHum,
      "Avg_Night_Hum_%": avgNightHum,
      "Soil_Moisture_%": avgSoilMoisture,
      Sunlight_Hours: sunlightHours,
      Rain_Level_mm: totalRainMm,
      Leaf_Wetness_Hours: leafWetnessHours,
      Cumulative_Stress_Index: cumulativeStressIndex,
      Hot_Days_Past_10_Days: trend.hot_days_past_10_days,
      Wet_Nights_Past_10_Days: trend.wet_nights_past_10_days,
      Dry_Soil_Days_Past_10_Days: trend.dry_soil_days_past_10_days,
      Flooded_Days_Past_10_Days: trend.flooded_days_past_10_days,
      Rainy_Days_Past_10_Days: trend.rainy_days_past_10_days,
      Total_Rain_Volume_mm_Past_10_Days:
        trend.total_rain_volume_mm_past_10_days,
    };

    // ── STEP 16: Call FastAPI ──────────────────────────────────────────────
    console.log(`[Aggregation] Calling FastAPI at ${FAST_API_URL}/predict ...`);

    const aiResponse = await axios.post(
      `${FAST_API_URL}/predict`,
      fastApiPayload,
    );

    const { health_status, prediction, confidence_percentage } =
      aiResponse.data;

    Health_status = health_status;
    Prediction = prediction;
    Confidence_percentage = confidence_percentage;

    console.log(
      `[Aggregation] AI result → ${prediction} (${confidence_percentage}% confidence)`,
    );

    // ── STEP 17: Save AIPrediction to MongoDB ──────────────────────────────
    const aiDoc = await AIprediction.create({
      machine_location: machineLocation,
      time_of_day: timeOfDay,

      beans_status: {
        beans_age_days: plantAgeDays,
        beans_growth_stage: growthStage,
      },

      todays_sensor_averages: {
        max_temp_c: maxTempC,
        min_temp_c: minTempC,
        avg_day_hum_percent: avgDayHum,
        avg_night_hum_percent: avgNightHum,
        soil_moisture_percent: avgSoilMoisture,
        sunlight_hours: sunlightHours,
        rain_level_mm: totalRainMm,
        leaf_wetness_hours: leafWetnessHours,
        cumulative_stress_index: cumulativeStressIndex,
      },

      the_10_days_past_weather: {
        total_hot_days_past_10_days: trend.hot_days_past_10_days,
        total_wet_nights_past_10_days: trend.wet_nights_past_10_days,
        total_dry_soil_days_past_10_days: trend.dry_soil_days_past_10_days,
        total_flooded_days_past_10_days: trend.flooded_days_past_10_days,
        total_rainy_days_past_10_days: trend.rainy_days_past_10_days,
        total_rain_volume_mm_past_10_days:
          trend.total_rain_volume_mm_past_10_days,
      },

      ai_result: {
        farm_status: health_status,
        prediction,
        confidence_percentage,
      },
    });

    // ── STEP 18: Link AIPrediction back to DailyAggregate ─────────────────
    await DailyAggregate.findByIdAndUpdate(saved._id, {
      ai_prediction_sent: true,
      ai_prediction_id: aiDoc._id,
    });

    const alertContext = {
      machine_location: machineLocation,
      time_of_day: timeOfDay,
      confidence: confidence_percentage,
      plant_age_days: plantAgeDays,
      growth_stage: growthStage,
      max_temp_c: maxTempC,
      soil_moisture_percent: avgSoilMoisture,
      rain_level_mm: totalRainMm,
      avg_night_hum_percent: avgNightHum,
    };

    // ── STEP 19: Send SMS alert if confidence meets threshold ──────────────
    if (confidence_percentage >= config.aiConfidence && prediction !== "Safe") {
      console.log(
        `[Aggregation] ⚠ Alert threshold met — SMS will be sent for: ${prediction}`,
      );

      // Call the sendFarmAlert function and await its result
      const smsAlertResult = await sendFarmAlert(
        prediction,
        confidence_percentage,
        alertContext,
      );

      const alertTimestamp = new Date();

      // Create an alert history record in MongoDB
      const alertRecord = await ALERTHISTORYSERVICE.create({
        machine_location: machineLocation,
        farmstatus: prediction,
        smsAlertSent: smsAlertResult.success ? "alert sent" : "alert failed",
        alertSentAt: alertTimestamp,
        status: prediction,
        confidence: confidence_percentage,
        timeStamp: alertTimestamp,
      });

      console.log(
        `[Aggregation] Alert history record created — ID: ${alertRecord._id}`,
      );
    } else {
      console.log(
        `[Aggregation] Alert threshold not met — no SMS sent for: ${prediction}`,
      );
    }

    console.log(
      `[Aggregation] ✅ ${timeOfDay} run complete for ${machineLocation}\n`,
    );
  } catch (error: any) {
    console.error(
      `[Aggregation] ❌ Error during ${timeOfDay} run for ${machineLocation}:`,
      error.message,
    );
  }
};
