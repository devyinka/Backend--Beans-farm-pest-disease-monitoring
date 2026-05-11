import { Request, Response } from "express";
import { CONFIGURATIONSERVICE } from "../Services/configurationService";

export const updateESP32andAI = async (req: Request, res: Response) => {
  try {
    const { machine_location, aiConfidence, sensorPollingRateMinutes } =
      req.body;
    if (
      !machine_location ||
      aiConfidence === undefined ||
      sensorPollingRateMinutes === undefined
    ) {
      return res.status(400).json({
        error:
          "machine_location, aiConfidence, and sensorPollingRateMinutes are required in the request body.",
      });
    }
    const updatedConfig = await CONFIGURATIONSERVICE.updateESP32andAI({
      machine_location,
      aiConfidence,
      sensorPollingRateMinutes,
    });
    return res.status(200).json({ data: updatedConfig });
  } catch (error) {
    console.error("Error updating ESP32 and AI configuration:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getSensorPollingRateandAIConfig = async (
  req: Request,
  res: Response,
) => {
  try {
    const { machine_location } = req.query;
    const { aiConfidence, sensorPollingRate, beansPlantingDate } =
      await CONFIGURATIONSERVICE.getSensorPollingRateandAIConfig(
        machine_location as string,
      );
    return res.status(200).json({
      data: { aiConfidence, sensorPollingRate, beansPlantingDate },
    });
  } catch (error) {
    console.error("Error fetching sensor polling rate:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
