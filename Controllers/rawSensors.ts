import { Request, Response } from "express";
import { RawsensorData } from "../type/types";
import { RAWSENSORSSERVICE } from "../Services/rawsensorService";

export const createRawsensorData = async (req: Request, res: Response) => {
  const {
    machine_location,
    temperature,
    humidity,
    soil_ph,
    soil_moisture,
    light_intensity,
    rain_level,
  } = req.body as RawsensorData;

  try {
    const pollingRateMinutes = await RAWSENSORSSERVICE.create({
      machine_location,
      temperature,
      humidity,
      soil_ph,
      soil_moisture,
      light_intensity,
      rain_level,
    });

    res.status(201).json({ pollingRateMinutes });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to create data", error: error.message });
  }
};
