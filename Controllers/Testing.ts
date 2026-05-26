import { Request, Response } from "express";
import { TESTINGSERVICE } from "../Services/Testing";
import { TestAIPayload } from "../type/types";

export const testingController=async (req: Request, res: Response) => {
    try {
        const payload: TestAIPayload = req.body;
        const aiResult = await TESTINGSERVICE.testAIAlgorithm(payload);
        res.status(200).json({ 
            message: "AI test completed successfully",
            ai: aiResult
        });
    } catch (error) {
        console.error("Error in testingController:", error);
        res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
    }
}
