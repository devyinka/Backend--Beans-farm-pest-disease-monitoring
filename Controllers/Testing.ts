import { Request, Response } from "express";
import { TESTINGSERVICE } from "../Services/Testing";
import { AuthRequest } from "../middleware/auth";
import { TestAIPayload } from "../type/types";

export const testingController = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    // Optional safety check: Ensure the ID exists before moving forward
    if (!currentUserId) {
      res.status(401).json({ message: "User identification failed." });
      return;
    }
    const payload: TestAIPayload = req.body;
    const aiResult = await TESTINGSERVICE.testAIAlgorithm(
      payload,
      currentUserId,
    );
    res.status(200).json({
      message: "AI test completed successfully",
      ai: aiResult,
    });
  } catch (error) {
    console.error("Error in testingController:", error);
    res
      .status(500)
      .json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
};
