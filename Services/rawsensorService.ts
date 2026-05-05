import Rawsensors from "../Models/Rawsensors";
import AIprediction from "../Models/AIprediction";
import { RawsensorData } from "../type/types";
import configuration from "../Models/configuration";
import { buildFarmUpdatePayload } from "../Socket/handler/farmPayload";
import { emitFarmUpdate } from "../Socket/handler/farm.handler";

export type RawSensorHistoryRecord = {
  __id: number;
  machine_location: string;
  temperature: number;
  humidity: number;
  rain_level: number;
  soil_moisture: number;
  light_level: number;
  soil_ph: number;
  timeStamp: Date;
};

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
    // Generate the next raw sensor ID in a simple, debug-friendly way.
    const lastRawSensor = await Rawsensors.findOne()
      .sort({ __id: -1 })
      .select({ __id: 1 })
      .lean<{ __id?: number }>();

    const nextRawSensorId = (lastRawSensor?.__id ?? 0) + 1;

    const newData = new Rawsensors({
      __id: nextRawSensorId,
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

    // Pull the current farm config so the emitted socket payload stays in sync with saved sensor data.
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

  getRecentHistory: async ({
    machine_location,
    hours = 24,
  }: {
    machine_location: string;
    hours?: number;
  }): Promise<RawSensorHistoryRecord[]> => {
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24;
    const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);

    return Rawsensors.find({
      machine_location,
      timeStamp: { $gte: since },
    })
      .sort({ timeStamp: 1, __id: 1 })
      .lean<RawSensorHistoryRecord[]>();
  },
};
