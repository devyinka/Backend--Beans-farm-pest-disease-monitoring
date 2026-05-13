import { getUI } from "../Controllers/getUI";
import { Router } from "express";

const getUIRouter = Router();
getUIRouter.get("/getUI", getUI);

export default getUIRouter;
