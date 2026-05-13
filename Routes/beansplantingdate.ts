import Router from "express";
import { getBeanPlantingDate } from "../Controllers/beanPlantingdate";
import { updateBeanPlantingDate } from "../Controllers/beanPlantingdate";

export const beanPlantingDateRouter = Router();
beanPlantingDateRouter.get("/BeanPlantingDate", getBeanPlantingDate);

export const updateBeanPlantingDateRouter = Router();
updateBeanPlantingDateRouter.post("/BeanPlantingDate", updateBeanPlantingDate);
