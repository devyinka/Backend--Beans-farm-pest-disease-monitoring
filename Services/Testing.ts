import axios from "axios";
import AIprediction from "../Models/AIprediction";
import DailyAggregate from "../Models/dailyAggregate";
import Configuration from "../Models/configuration";
import { sendFarmAlert } from "../utility/smsAlert";
import { ALERTHISTORYSERVICE } from "./alertHistoryService";
import { emitFarmUpdate } from "../Socket/handler/farm.handler";
import { buildFarmUpdatePayload } from "../Socket/handler/farmPayload";
import frontEndUI from "../Models/frontEndUI";
import { TestAIPayload } from "../type/types";



const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/predict";

// Helper function to convert time number to string
const getTimeOfDayString = (timeOfDay: number): "morning" | "evening" => {
  return timeOfDay === 0 ? "morning" : "evening";
};

// This service is for testing the AI integration with custom payloads
export const TESTINGSERVICE = {
  testAIAlgorithm: async (payload: TestAIPayload): Promise<void> => {
    try {
      const config = await Configuration.findOne({
        machine_location: payload.machine_location,
      }).lean();

      if (!config) {
        console.error(
          `[Test AI] No config found for ${payload.machine_location} — skipping`,
        );
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const timeOfDayStr = getTimeOfDayString(payload.Time_of_Day);

      // Build the aggregate document
      const aggregateData = {
        machine_location: payload.machine_location,
        date: today,
        time_of_day: timeOfDayStr,

        // Sensor averages
        max_temp_c: payload.Max_Temp_C,
        min_temp_c: payload.Min_Temp_C,
        avg_day_hum_percent: payload.Avg_Day_Hum,
        avg_night_hum_percent: payload.Avg_Night_Hum,
        soil_moisture_percent: payload.Soil_Moisture,
        sunlight_hours: payload.Sunlight_Hours,
        rain_level_mm: payload.Rain_Level_mm,
        leaf_wetness_hours: payload.Leaf_Wetness_Hours,
        cumulative_stress_index: payload.Cumulative_Stress_Index,

        // 10-day trends
        hot_days_past_10_days: payload.Hot_Days_Past_10_Days,
        wet_nights_past_10_days: payload.Wet_Nights_Past_10_Days,
        dry_soil_days_past_10_days: payload.Dry_Soil_Days_Past_10_Days,
        flooded_days_past_10_days: payload.Flooded_Days_Past_10_Days,
        rainy_days_past_10_days: payload.Rainy_Days_Past_10_Days,
        total_rain_volume_mm_past_10_days:
          payload.Total_Rain_Volume_mm_Past_10_Days,

        // Bean status
        plant_age_days: payload.Plant_Age_Days,
        growth_stage: payload.Growth_Stage,

        // Meta
        readings_count: 0,
        ai_prediction_sent: false,
        ai_prediction_id: null,
      };

      const saved = await DailyAggregate.findOneAndUpdate(
        {
          machine_location: payload.machine_location,
          date: today,
          time_of_day: timeOfDayStr,
        },
        aggregateData,
        { upsert: true, new: true },
      );

      // Prepare FastAPI payload with correct field names
      const fastApiPayload = {
        Time_of_Day: payload.Time_of_Day,
        Plant_Age_Days: payload.Plant_Age_Days,
        Max_Temp_C: payload.Max_Temp_C,
        Min_Temp_C: payload.Min_Temp_C,
        Avg_Day_Hum:payload.Avg_Day_Hum,
        Avg_Night_Hum: payload.Avg_Night_Hum,
        Soil_Moisture: payload.Soil_Moisture,
        Sunlight_Hours: payload.Sunlight_Hours,
        Rain_Level_mm: payload.Rain_Level_mm,
        Leaf_Wetness_Hours: payload.Leaf_Wetness_Hours,
        Cumulative_Stress_Index: payload.Cumulative_Stress_Index,
        Hot_Days_Past_10_Days: payload.Hot_Days_Past_10_Days,
        Wet_Nights_Past_10_Days: payload.Wet_Nights_Past_10_Days,
        Dry_Soil_Days_Past_10_Days: payload.Dry_Soil_Days_Past_10_Days,
        Flooded_Days_Past_10_Days: payload.Flooded_Days_Past_10_Days,
        Rainy_Days_Past_10_Days: payload.Rainy_Days_Past_10_Days,
        Total_Rain_Volume_mm_Past_10_Days:
          payload.Total_Rain_Volume_mm_Past_10_Days,
      };

      console.log(
        `[Test AI] Calling FastAPI at ${FASTAPI_URL} with payload...`,
      );

      const aiResponse = await axios.post(FASTAPI_URL, fastApiPayload);

      if (!aiResponse.data) {
        console.error(`[Test AI] No data received from AI response`);
        return;
      }

      const { health_status, prediction, confidence_percentage } =
        aiResponse.data;

      console.log(
        `[Test AI] Health Status: ${health_status}, Prediction: ${prediction}, Confidence: ${confidence_percentage}%`,
      );

      const aiDoc = await AIprediction.create({
        machine_location: payload.machine_location,
        time_of_day: timeOfDayStr,
        beans_status: {
          beans_age_days: payload.Plant_Age_Days,
          beans_growth_stage: payload.Growth_Stage,
        },

        todays_sensor_averages: {
          max_temp_c: payload.Max_Temp_C,
          min_temp_c: payload.Min_Temp_C,
          avg_day_hum_percent: payload.Avg_Day_Hum,
          avg_night_hum_percent: payload.Avg_Night_Hum,
          soil_moisture_percent: payload.Soil_Moisture,
          sunlight_hours: payload.Sunlight_Hours,
          rain_level_mm: payload.Rain_Level_mm,
          leaf_wetness_hours: payload.Leaf_Wetness_Hours,
          cumulative_stress_index: payload.Cumulative_Stress_Index,
        },

        the_10_days_past_weather: {
          total_hot_days_past_10_days: payload.Hot_Days_Past_10_Days,
          total_wet_nights_past_10_days: payload.Wet_Nights_Past_10_Days,
          total_dry_soil_days_past_10_days: payload.Dry_Soil_Days_Past_10_Days,
          total_flooded_days_past_10_days: payload.Flooded_Days_Past_10_Days,
          total_rainy_days_past_10_days: payload.Rainy_Days_Past_10_Days,
          total_rain_volume_mm_past_10_days:
            payload.Total_Rain_Volume_mm_Past_10_Days,
        },

        ai_result: {
          farm_status: health_status,
          prediction: prediction,
          confidence_percentage: confidence_percentage,
        },
      });

      // Update the DailyAggregate with AI prediction info
      await DailyAggregate.findByIdAndUpdate(saved._id, {
        ai_prediction_sent: true,
        ai_prediction_id: aiDoc._id,
      });

      // ── Emit Socket.io update to frontend ──────────────────────────────────
      const livePayload = buildFarmUpdatePayload({
        machineLocation: payload.machine_location,
        temperature: payload.Max_Temp_C,
        humidity: payload.Avg_Day_Hum,
        rainLevel: payload.Rain_Level_mm,
        soilMoisture: payload.Soil_Moisture,
        light_level: 0, // Not available from test payload
        pollingRateMinutes: config.sensorPollingRateMinutes,
        prediction: prediction,
        confidence: confidence_percentage,
      });

      const updateData: any = {
        machine_location: payload.machine_location,
        sensors: livePayload.sensors,
        timeStamp: new Date(),
      };

      if (livePayload.AIData) {
        updateData.AIData = livePayload.AIData;
      }
      if (livePayload.farmInfo) {
        updateData.farmInfo = livePayload.farmInfo;
      }

      const savedUI = await frontEndUI.findOneAndUpdate(
        { machine_location: payload.machine_location },
        { $set: updateData },
        { upsert: true, new: true },
      );

      if (savedUI) {
        emitFarmUpdate({
          timestamp: savedUI.timeStamp.toISOString(),
          datainterval: config.sensorPollingRateMinutes,
          sensors: livePayload.sensors,
          AIData: livePayload.AIData,
          farmInfo: livePayload.farmInfo,
        });
        console.log(
          `[Test AI] Socket.io update emitted for ${payload.machine_location}`,
        );
      }

      // If the prediction is not "Safe" with high confidence, send an alert
      const alertContext = {
        machine_location: payload.machine_location,
        time_of_day: timeOfDayStr,
        confidence: confidence_percentage,
        plant_age_days: payload.Plant_Age_Days,
        growth_stage: payload.Growth_Stage,
        max_temp_c: payload.Max_Temp_C,
        soil_moisture_percent: payload.Soil_Moisture,
        rain_level_mm: payload.Rain_Level_mm,
        avg_night_hum_percent: payload.Avg_Night_Hum,
      };

      if (confidence_percentage >= config.aiConfidence && prediction !== "Safe") {
        console.log(
          `[Test AI] ⚠ Alert threshold met — SMS will be sent for: ${prediction} with confidence ${confidence_percentage}% at ${payload.machine_location} (${timeOfDayStr})`,
        );

        const smsAlertResult = await sendFarmAlert(
          prediction,
          confidence_percentage,
          alertContext,
        );

        const alertTimestamp = new Date();

        // Create an alert history record in MongoDB
        const alertRecord = await ALERTHISTORYSERVICE.create({
          machine_location: payload.machine_location,
          farmstatus: prediction,
          smsAlertSent: smsAlertResult.success ? "alert sent" : "alert failed",
          alertSentAt: alertTimestamp,
          status: prediction,
          confidence: confidence_percentage,
          timeStamp: alertTimestamp,
        });

        console.log(
          `[Test AI] Alert history record created — ID: ${alertRecord._id}`,
        );
      } else {
        console.log(
          `[Test AI] Alert threshold not met — no SMS sent for: ${prediction}`,
        );
      }

      console.log(
        `[Test AI] ✅ Test run complete for ${payload.machine_location}\n`,
      );
    } catch (error: any) {
      console.error(
        `[Test AI] ❌ Error during test run for ${payload.machine_location}:`,
        error.message,
      );
    }
  },
};

