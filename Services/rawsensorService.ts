import Rawsensors from "../Models/Rawsensors";
import AIprediction from "../Models/AIprediction";
import {
  FarmInfo,
  RawsensorData,
  FarmAIData,
  FarmSensorReading,
} from "../type/types";
import configuration from "../Models/configuration";
import { buildFarmUpdatePayload } from "../Socket/handler/farmPayload";
import { emitFarmUpdate } from "../Socket/handler/farm.handler";
import frontEndUI from "../Models/frontEndUI";

export type RawSensorHistoryRecord = {
  __id: number;
  machine_location: string;
  temperature: number;
  humidity: number;
  rain_level: number;
  soil_moisture: number;
  light_level: number;
  timeStamp: Date;
};

export const RAWSENSORSSERVICE = {
  create: async ({
    machine_location,
    temperature,
    humidity,
    soil_moisture,
    light_level,
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
      light_level,
      rain_level,
      timeStamp: Date.now(),
    });
    await newData.save();

    // After saving the new sensor data, fetch the latest configuration and AI prediction to include in the live update payload for the frontend.
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

    // Build the payload with the new sensor data, latest prediction, and config for the frontend dashboard.
    const livePayload = buildFarmUpdatePayload({
      machineLocation: machine_location,
      temperature,
      humidity,
      rainLevel: rain_level,
      soilMoisture: soil_moisture,
      light_level,
      pollingRateMinutes,
      prediction: latestPrediction?.ai_result?.prediction ?? null,
      confidence: latestPrediction?.ai_result?.confidence_percentage ?? null,
    });

    const updateData: any = {
      machine_location: machine_location,
      sensors: livePayload.sensors,
      timeStamp: Date.now(),
    };

    // Only add AIData and farmInfo to the update IF the payload actually contains them!
    if (livePayload.AIData) {
      updateData.AIData = livePayload.AIData;
    }
    if (livePayload.farmInfo) {
      updateData.farmInfo = livePayload.farmInfo;
    }

    const savedUI = await frontEndUI.findOneAndUpdate(
      { machine_location: machine_location },
      { $set: updateData },
      { upsert: true, new: true },
    );

    if (savedUI) {
      emitFarmUpdate({
        timestamp: savedUI.timeStamp.toISOString(),
        datainterval: pollingRateMinutes, //  Passed from your local config variable
        sensors: savedUI.sensors as FarmSensorReading[],
        AIData: savedUI.AIData as FarmAIData,
        farmInfo: savedUI.farmInfo as FarmInfo,
      });
    }

    return pollingRateMinutes;
  },

  getRecentHistory: async ({
    machine_location,
    hours = 24,
  }: {
    machine_location: string;
    hours?: number;
  }): Promise<RawSensorHistoryRecord[]> => {
    const config = await configuration
      .findOne({ machine_location })
      .lean<{ sensorPollingRateMinutes?: number }>();

    const pollingRateMinutes = config?.sensorPollingRateMinutes ?? 30;
    const recordsNeeded = Math.ceil((hours * 60) / pollingRateMinutes);

    // Fetching enough records to cover the hours based on the polling rate
    const records = await Rawsensors.find({ machine_location })
      .sort({ _id: -1 })
      .limit(recordsNeeded)
      .lean<any[]>(); // Use any[] temporarily since old records might have string timeStamps

    const formattedRecords = records.map((record) => {
      // Ensure timeStamp is a Date object
      if (!(record.timeStamp instanceof Date)) {
        record.timeStamp = new Date(record.timeStamp);
      }
      return record as RawSensorHistoryRecord;
    });

    return formattedRecords.reverse();
  },
};
