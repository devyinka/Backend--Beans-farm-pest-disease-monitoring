import { Router } from "express";
import {
  getSensorPollingRateandAIConfig,
  updateESP32andAI,
} from "../Controllers/ESP32&AI";

const updateESP32andAIRouter = Router();
updateESP32andAIRouter.post("/Configuration", updateESP32andAI);
export default updateESP32andAIRouter;

export const getSensorPollingRateRouter = Router();
getSensorPollingRateRouter.get(
  "/SensorPollingRate",
  getSensorPollingRateandAIConfig,
);
