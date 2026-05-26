import { Request, Response } from "express";
import { SPRAYINGSERVICE } from "../Services/spraying";

export const sprayingController = async (req: Request, res: Response) => {
  const { machine_location, action, status } = req.body;
  
  // Validate required fields
  if (!machine_location || typeof action !== "boolean" || !["pest", "disease"].includes(status)) {
    return res.status(400).json({ 
      message: "Invalid request parameters. Required: machine_location (string), action (boolean), status ('pest' | 'disease')" 
    });
  }

  try {
    await SPRAYINGSERVICE.sprayingAction({ machine_location, action, status });
    res.status(200).json({ message: "Spraying action recorded successfully." });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Spraying controller error:", errorMessage);
    
    res.status(500).json({ 
      message: "Failed to record spraying action.",
      error: errorMessage,
      hint: errorMessage.includes("MQTT") ? "MQTT broker connection issue. Check backend logs and MQTT credentials." : undefined
    });
  }
};


