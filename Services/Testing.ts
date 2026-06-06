import axios from "axios";
import AIprediction from "../Models/AIprediction";
import DailyAggregate from "../Models/dailyAggregate";
import Configuration from "../Models/configuration";
import { sendFarmAlert } from "../utility/africaltalking";
import { ALERTHISTORYSERVICE } from "./alertHistoryService";
import { emitFarmUpdate } from "../Socket/handler/farm.handler";
import { buildFarmUpdatePayload } from "../Socket/handler/farmPayload";
import frontEndUI from "../Models/frontEndUI";
import { FarmUpdatePayload, TestAIPayload } from "../type/types";

const getFastApiUrl = (): string => {
  const fastApiUrl = process.env.FAST_API_URL;
  if (typeof fastApiUrl !== "string" || fastApiUrl.length === 0) {
    throw new Error(
      "FAST_API_URL is not configured. Set it in backend/.env before running the AI test.",
    );
  }
  return fastApiUrl;
};

type AIResult = {
  status: string;
  threat_name: string;
  percentage: number;
};

const getTimeOfDayString = (timeOfDay: number): "morning" | "evening" => {
  return timeOfDay === 0 ? "morning" : "evening";
};

export const TESTINGSERVICE = {
  // Accepts the optional userId from the controller for historical logging
  testAIAlgorithm: async (
    payload: TestAIPayload,
    userId?: string,
  ): Promise<AIResult> => {
    try {
      const FASTAPI_URL = getFastApiUrl();

      const config = await Configuration.findOne({
        machine_location: payload.machine_location,
      }).lean();

      if (!config) {
        throw new Error(
          `No config found for ${payload.machine_location} — cannot run AI test`,
        );
      }

      // Safe date normalization avoiding cloud UTC shifts
      const today = new Date(new Date().toDateString());
      const timeOfDayStr = getTimeOfDayString(payload.Time_of_Day);

      const aggregateData = {
        machine_location: payload.machine_location,
        date: today,
        time_of_day: timeOfDayStr,
        max_temp_c: payload.Max_Temp_C,
        min_temp_c: payload.Min_Temp_C,
        avg_day_hum_percent: payload.Avg_Day_Hum,
        avg_night_hum_percent: payload.Avg_Night_Hum,
        soil_moisture_percent: payload.Soil_Moisture,
        sunlight_hours: payload.Sunlight_Hours,
        rain_level_mm: payload.Rain_Level_mm,
        leaf_wetness_hours: payload.Leaf_Wetness_Hours,
        cumulative_stress_index: payload.Cumulative_Stress_Index,
        hot_days_past_10_days: payload.Hot_Days_Past_10_Days,
        wet_nights_past_10_days: payload.Wet_Nights_Past_10_Days,
        dry_soil_days_past_10_days: payload.Dry_Soil_Days_Past_10_Days,
        flooded_days_past_10_days: payload.Flooded_Days_Past_10_Days,
        rainy_days_past_10_days: payload.Rainy_Days_Past_10_Days,
        total_rain_volume_mm_past_10_days:
          payload.Total_Rain_Volume_mm_Past_10_Days,
        plant_age_days: payload.Plant_Age_Days,
        growth_stage: payload.Growth_Stage,
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
        { $set: aggregateData },
        { upsert: true, returnDocument: "after" },
      );

      const fastApiPayload = {
        Time_of_Day: payload.Time_of_Day,
        Plant_Age_Days: payload.Plant_Age_Days,
        Max_Temp_C: payload.Max_Temp_C,
        Min_Temp_C: payload.Min_Temp_C,
        Avg_Day_Hum: payload.Avg_Day_Hum,
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

      console.log(`[Test AI] Calling FastAPI at ${FASTAPI_URL}/Predict...`);
      const aiResponse = await axios.post(
        `${FASTAPI_URL}/Predict`,
        fastApiPayload,
      );

      if (!aiResponse.data) {
        throw new Error(`No data received from AI response`);
      }

      const { status, threat_name, percentage } = aiResponse.data as AIResult;

      if (!status || threat_name === undefined || percentage === undefined) {
        throw new Error(
          `Invalid AI response format: ${JSON.stringify(aiResponse.data)}`,
        );
      }

      const plantingDate = new Date(today);
      plantingDate.setDate(plantingDate.getDate() - payload.Plant_Age_Days);

      // Saves the log with the user attached so you have an explicit audit record
      const aiDoc = await AIprediction.create({
        machine_location: payload.machine_location,
        time_of_day: timeOfDayStr,
        beans_status: {
          beans_planting_date: plantingDate,
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
          farm_status: status,
          prediction: threat_name,
          confidence_percentage: percentage,
        },
      });

      await DailyAggregate.findByIdAndUpdate(saved._id, {
        $set: {
          ai_prediction_sent: true,
          ai_prediction_id: aiDoc._id,
        },
      });

      // Assemble UI Updates
      const livePayload: FarmUpdatePayload = buildFarmUpdatePayload({
        machineLocation: payload.machine_location,
        temperature: payload.Max_Temp_C,
        humidity: payload.Avg_Day_Hum,
        rainLevel: payload.Rain_Level_mm,
        soilMoisture: payload.Soil_Moisture,
        light_level: 0,
        pollingRateMinutes: config.sensorPollingRateMinutes,
        prediction: threat_name,
        confidence: percentage,
      });

      const updateData: any = {
        machine_location: payload.machine_location,
        sensors: livePayload.sensors,
        timeStamp: new Date(),
      };

      if (livePayload.AIData) updateData.AIData = livePayload.AIData;
      if (livePayload.farmInfo) updateData.farmInfo = livePayload.farmInfo;

      const savedUI = await frontEndUI.findOneAndUpdate(
        { machine_location: payload.machine_location },
        { $set: updateData },
        { upsert: true, returnDocument: "after" },
      );

      // Emit real-time Socket.io update back to the frontend UI
      if (savedUI) {
        emitFarmUpdate({
          timeStamp: savedUI.timeStamp.toISOString(),
          datainterval: config.sensorPollingRateMinutes,
          sensors: livePayload.sensors,
          AIData: livePayload.AIData,
          farmInfo: livePayload.farmInfo,
        });
        console.log(
          `[Test AI] Socket.io update emitted for ${payload.machine_location}`,
        );
      }

      // Check threshold rules to see if an SMS threat warning is required
      if (
        percentage >= config.aiConfidence &&
        threat_name !== "None" &&
        status !== "Safe"
      ) {
        console.log(
          `[Test AI] ⚠ Dispatching African's Talking SMS for: ${threat_name}`,
        );

        const alertContext = {
          machine_location: payload.machine_location,
          time_of_day: timeOfDayStr,
          confidence: percentage,
          plant_age_days: payload.Plant_Age_Days,
          growth_stage: payload.Growth_Stage,
          max_temp_c: payload.Max_Temp_C,
          soil_moisture_percent: payload.Soil_Moisture,
          rain_level_mm: payload.Rain_Level_mm,
          avg_night_hum_percent: payload.Avg_Night_Hum,
        };

        const smsAlertResult = await sendFarmAlert(
          threat_name,
          percentage,
          alertContext,
        );
        const alertTimestamp = new Date();

        // Create log record in your alert histories collection
        await ALERTHISTORYSERVICE.create({
          machine_location: payload.machine_location,
          farmstatus: threat_name,
          smsAlertSent: smsAlertResult.success ? "alert sent" : "alert failed",
          alertSentAt: alertTimestamp,
          status: threat_name,
          confidence: percentage,
          timeStamp: alertTimestamp,
        });
      }

      return { status, threat_name, percentage };
    } catch (error: any) {
      console.error(
        `[Test AI] Error for ${payload.machine_location}:`,
        error.message,
      );
      throw error;
    }
  },
};
