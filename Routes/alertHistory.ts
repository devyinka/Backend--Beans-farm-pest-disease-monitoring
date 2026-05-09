import { getAlertHistory } from "../Controllers/alertHistory";
import { Router } from "express";

const alertHistoryRouter = Router();
alertHistoryRouter.get("/alert-history", getAlertHistory);

export default alertHistoryRouter;
