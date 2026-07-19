import { Router } from "express";
import { testingController } from "../Controllers/Testing";

const testingRouter = Router();

testingRouter.post("/AIAlgorithm", testingController);

export default testingRouter;
