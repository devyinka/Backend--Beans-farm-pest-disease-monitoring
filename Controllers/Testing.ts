import { Request, Response } from "express";
import { TESTINGSERVICE } from "../Services/Testing";
import { TestAIPayload } from "../type/types";

export const testingController=async (req: Request, res: Response) => {
    try {
        const payload: TestAIPayload = req.body;
        await TESTINGSERVICE.testAIAlgorithm(payload);
        res.status(200).json({ message: "AI test completed successfully" });
    } catch (error) {
        console.error("Error in testingController:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
