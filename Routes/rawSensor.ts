import { Router } from "express";
import { createRawsensorData } from "../Controllers/rawSensors";

const savesensordata = Router();

savesensordata.post("/saverawsensordata", createRawsensorData);

export default savesensordata;
