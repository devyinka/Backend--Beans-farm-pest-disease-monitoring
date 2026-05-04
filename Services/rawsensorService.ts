import Rawsensors from "../Models/Rawsensors";
import AIprediction from "../Models/AIprediction";
import { RawsensorData } from "../type/types";
import configuration from "../Models/configuration";
import { buildFarmUpdatePayload } from "../Socket/handler/farmPayload";
import { emitFarmUpdate } from "../Socket/handler/farm.handler";

export const RAWSENSORSSERVICE = {
  create: async ({
    machine_location,
    temperature,
    humidity,
    soil_ph,
    soil_moisture,
    light_intensity,
    rain_level,
  }: RawsensorData): Promise<any> => {
    const newData = new Rawsensors({
      machine_location,
      temperature,
      humidity,
      soil_moisture,
      light_level: light_intensity,
      rain_level,
      soil_ph,
      timeStamp: Date.now(),
    });
    await newData.save();

    // Use the farm-specific tuning when available; fall back to the default poll rate.
    const config = await configuration
      .findOne({ machine_location })
      .lean<{ sensorPollingRateMinutes?: number }>();

    // Pull the latest AI prediction so the frontend can show the most recent spray suggestion.
    const latestPrediction = await AIprediction.findOne({ machine_location })
      .sort({ timeStamp: -1 })
      .lean<{
        ai_result?: {
          prediction?: string;
          confidence_percentage?: number;
        };
      }>();

    const pollingRateMinutes = config?.sensorPollingRateMinutes ?? 30;
    const livePayload = buildFarmUpdatePayload({
      machineLocation: machine_location,
      temperature,
      humidity,
      rainLevel: rain_level,
      soilMoisture: soil_moisture,
      lightIntensity: light_intensity,
      soilPh: soil_ph,
      pollingRateMinutes,
      prediction: latestPrediction?.ai_result?.prediction ?? null,
      confidence: latestPrediction?.ai_result?.confidence_percentage ?? null,
    });

    // Broadcast the live farm state to the frontend; the ESP32 only needs the interval.
    emitFarmUpdate(livePayload);

    return pollingRateMinutes;
  },
};
