import { Request, Response } from "express";
import { CONFIGURATIONSERVICE } from "../Services/configurationService";

// This controller allows the frontend to fetch the bean planting date for a specific machine location. The frontend should send a GET request with the machine_location as a query parameter. The response will include the planting date and the last updated timestamp for that machine location.
export const getBeanPlantingDate = async (req: Request, res: Response) => {
  try {
    const { machine_location } = req.query;
    if (!machine_location) {
      return res.status(400).json({
        error: "machine_location is required",
      });
    }
    const beanPlantingDate = await CONFIGURATIONSERVICE.getBeanPlantingDate(
      machine_location as string,
    );
    return res.status(200).json(beanPlantingDate);
  } catch (error) {
    console.error("Error fetching bean planting date:", error);
    return res.status(500).json({
      error: "Failed to fetch bean planting date",
    });
  }
};

// This controller allows the frontend to update the bean planting date for a specific machine location. The frontend should send a POST request with the machine_location and the new plantingDate in the request body. The updated configuration will be saved in the database, and the response will include the updated configuration data.
export const updateBeanPlantingDate = async (req: Request, res: Response) => {
  try {
    const { machine_location, plantingDate } = req.body;
    console.log("WHAT NODE SEES:", req.body);
    if (!machine_location || !plantingDate) {
      return res.status(400).json({
        error: "machine_location and plantingDate are required",
      });
    }
    const updatedConfig = await CONFIGURATIONSERVICE.updateBeanPlantingDate(
      machine_location,
      new Date(plantingDate),
    );
    return res.status(200).json({ data: updatedConfig });
  } catch (error) {
    console.error("Error updating bean planting date:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
