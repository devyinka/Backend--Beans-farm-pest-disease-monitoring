import { Response } from "express";
import { SPRAYINGSERVICE } from "../Services/spraying";
import { AuthRequest } from "../middleware/auth";

export const sprayingController = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  const { machine_location, action, status } = req.body;

  // 1. Strict Request Body Validation
  if (
    !machine_location ||
    typeof action !== "boolean" ||
    !["pest", "disease"].includes(status)
  ) {
    return res.status(400).json({
      message:
        "Invalid request parameters. Required: machine_location (string), action (boolean), status ('pest' | 'disease')",
    });
  }

  try {
    const currentUserId = req.userId;

    // Explicit safety guard: Ensure user has been authenticated by the JWT middleware layer
    if (!currentUserId) {
      return res
        .status(401)
        .json({ message: "Access denied. Invalid user identity context." });
    }

    // Dispatch Action (Pass currentUserId if your service/audit system tracks it)
    await SPRAYINGSERVICE.sprayingAction({ machine_location, action, status });

    return res
      .status(200)
      .json({ message: "Spraying action recorded successfully." });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Spraying controller error:", errorMessage);

    return res.status(500).json({
      message: "Failed to record spraying action.",
      error: errorMessage,
      hint: errorMessage.includes("MQTT")
        ? "MQTT broker connection issue. Check backend logs and MQTT credentials."
        : undefined,
    });
  }
};
