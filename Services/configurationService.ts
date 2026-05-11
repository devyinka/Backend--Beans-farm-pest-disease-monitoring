import { get } from "http";
import configuration from "../Models/configuration";

interface ESP32ANDAIconfiguration {
  machine_location: string;
  aiConfidence: number;
  sensorPollingRateMinutes: number;
}

export const CONFIGURATIONSERVICE = {
  updateESP32andAI: async ({
    machine_location,
    aiConfidence,
    sensorPollingRateMinutes,
  }: ESP32ANDAIconfiguration) => {
    const existingConfig = await configuration.findOne({ machine_location });

    if (existingConfig) {
      existingConfig.aiConfidence = aiConfidence;
      existingConfig.sensorPollingRateMinutes = sensorPollingRateMinutes;
      existingConfig.updatedAt = new Date();
      return await existingConfig.save();
    } else {
      const newConfig = new configuration({
        machine_location,
        aiConfidence,
        sensorPollingRateMinutes,
        updatedAt: new Date(),
      });
      return await newConfig.save();
    }
  },
  getSensorPollingRateandAIConfig: async (machine_location: string) => {
    const config = await configuration.findOne({ machine_location }).lean();
    if (!config) {
      throw new Error(
        `No configuration found for machine_location: ${machine_location}`,
      );
    }
    return {
      aiConfidence: config.aiConfidence,
      sensorPollingRate: config.sensorPollingRateMinutes,
      beansPlantingDate: config.BeanPlantingDate,
    };
  },
  getBeanPlantingDate: async (machine_location: string) => {
    const config = await configuration.findOne({ machine_location }).lean();
    if (!config) {
      throw new Error(
        `No configuration found for machine_location: ${machine_location}`,
      );
    }
    return {
      plantingDate: config.BeanPlantingDate,
      updatedAt: config.updatedAt,
    };
  },
  updateBeanPlantingDate: async (
    machine_location: string,
    plantingDate: Date,
  ) => {
    const existingConfig = await configuration.findOne({ machine_location });

    if (existingConfig) {
      existingConfig.BeanPlantingDate = plantingDate;
      existingConfig.updatedAt = new Date();
      return await existingConfig.save();
    } else {
      const newConfig = new configuration({
        machine_location,
        BeanPlantingDate: plantingDate,
        updatedAt: new Date(),
      });
      return await newConfig.save();
    }
  },
};
