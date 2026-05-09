import { Request, Response } from "express";
import { ALERTHISTORYSERVICE } from "../Services/alertHistoryService";

export const getAlertHistory = async (req: Request, res: Response) => {
  const machine_location = req.query.machine_location as string | undefined;

  if (!machine_location) {
    res.status(400).json({
      message: "machine_location is required in the query string.",
    });
    return;
  }
  try {
    const history =
      await ALERTHISTORYSERVICE.getAlertyHistoryByLocation(machine_location);
    res.status(200).json({
      machine_location,
      data: history,
    });
  } catch (error: any) {
    console.error("Error fetching alert history:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch alert history", error: error.message });
  }
};
