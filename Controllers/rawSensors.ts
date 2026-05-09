import { Request, Response } from "express";
import { RawsensorData } from "../type/types";
import { RAWSENSORSSERVICE } from "../Services/rawsensorService";

export const createRawsensorData = async (req: Request, res: Response) => {
  const {
    machine_location,
    temperature,
    humidity,
    soil_moisture,
    light_level,
    rain_level,
  } = req.body as RawsensorData;

  try {
    // Save the live ESP32 reading first; the socket update is emitted from the service after this succeeds.
    const pollingRateMinutes = await RAWSENSORSSERVICE.create({
      machine_location,
      temperature,
      humidity,
      soil_moisture,
      light_level,
      rain_level,
    });
    console.log("=== DATA SAVED TO MONGODB SUCCESSFULLY ===");
    res.status(201).json({ pollingRateMinutes });
  } catch (error: any) {
    console.error("=== MONGODB SAVE ERROR ===", error.message);
    res
      .status(500)
      .json({ message: "Failed to create data", error: error.message });
  }
};

export const getRawsensorHistory = async (req: Request, res: Response) => {
  const machine_location = String(req.query.machine_location ?? "").trim();
  const hoursParam = Number(req.query.hours ?? 24);

  if (!machine_location) {
    res.status(400).json({
      message: "machine_location query parameter is required.",
    });
    return;
  }

  try {
    // This endpoint is used by the frontend to seed the chart before live socket data starts arriving.
    const readings = await RAWSENSORSSERVICE.getRecentHistory({
      machine_location,
      hours: Number.isFinite(hoursParam) ? hoursParam : 24,
    });

    res.status(200).json({
      machine_location,
      hours: Number.isFinite(hoursParam) ? hoursParam : 24,
      readings,
    });
  } catch (error: any) {
    console.error("=== MONGODB HISTORY ERROR ===", error.message);
    res.status(500).json({
      message: "Failed to load raw sensor history",
      error: error.message,
    });
  }
};
