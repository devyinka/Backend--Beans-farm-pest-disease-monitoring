import { Request, Response } from "express";
import { SPRAYINGSERVICE } from "../Services/spraying";

export const sprayingController = async (req: Request, res: Response) => {
  const { machine_location, action, status } = req.body;
  try {
    await SPRAYINGSERVICE.sprayingAction({ machine_location, action, status });
    res.status(200).json({ message: "Spraying action recorded successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to record spraying action.", error });
  }
};


