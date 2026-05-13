import frontEndUI from "../Models/frontEndUI";

export const FRONTENDUISERVICE = {
  getFrontendUIByLocation: async (machine_location: string) => {
    return await frontEndUI
      .find({ machine_location })
      .sort({ timeStamp: -1 })
      .lean();
  },
};
