import sprayingaction from "../Models/sprayingaction";
import { sendCommandToFarm } from "../utility/mqtt";
export interface sprayingActionPayload {
  machine_location: string;
  action: boolean;
  status: "disease" | "pest";
}

export const SPRAYINGSERVICE = {
  sprayingAction: async ({ machine_location, action, status }: sprayingActionPayload): Promise<void> => {
    try {
      const response = await  sprayingaction.findOneAndUpdate(
        { machine_location},
        { action, status, timestamp: new Date() },
        {returnDocument: 'after', upsert: true }
      );

      if(response){
       await sendCommandToFarm(`${machine_location}/spraying`, { status, action });
      console.log("Spraying action recorded:", response);
      } else {
        console.error("Failed to record spraying action for location:", machine_location);
      }
    } catch (error) {
      console.error("Error recording spraying action:", error);
      throw error;
    }
  },
};

        