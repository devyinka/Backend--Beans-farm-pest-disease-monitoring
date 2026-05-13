import alertHistory from "../Models/alertHistory";
import { AlertHistoryRecord } from "../type/types";

export const ALERTHISTORYSERVICE = {
  create: async ({
    machine_location,
    farmstatus,
    smsAlertSent,
    alertSentAt,
    status,
    confidence,
    timeStamp,
  }: AlertHistoryRecord) => {
    const newAlertHistory = new alertHistory({
      machine_location,
      farmstatus,
      smsAlertSent,
      alertSentAt,
      status,
      confidence,
      timeStamp,
    });
    return await newAlertHistory.save();
  },
  getAlertyHistoryByLocation: async (machine_location: string) => {
    return await alertHistory
      .find({ machine_location })
      .sort({ timeStamp: -1 })
      .lean();
  },
};
