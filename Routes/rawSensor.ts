import { Router } from "express";
import {
  createRawsensorData,
  getRawsensorHistory,
} from "../Controllers/rawSensors";

const savesensordata = Router();

savesensordata.post("/saverawsensordata", createRawsensorData);
savesensordata.get("/history", getRawsensorHistory);

export default savesensordata;
