import { FRONTENDUISERVICE } from "../Services/getUI";
import { Request, Response } from "express";

export const getUI = async (req: Request, res: Response) => {
  try {
    const { machine_location } = req.query;
    if (typeof machine_location !== "string") {
      return res.status(400).json({
        error:
          "machine_location query parameter is required and must be a string.",
      });
    }

    const frontendUI =
      await FRONTENDUISERVICE.getFrontendUIByLocation(machine_location);
    return res.status(200).json({ data: frontendUI });
  } catch (error) {
    console.error("Error fetching frontend UI:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
