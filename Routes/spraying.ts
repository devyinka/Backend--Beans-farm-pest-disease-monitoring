import Router from "express";
import { sprayingController } from "../Controllers/spraying";

const sprayingRouter = Router();

sprayingRouter.post("/action", sprayingController);

export default sprayingRouter;
