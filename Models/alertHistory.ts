import mongoose from "mongoose";

const AlertHistorySchema = new mongoose.Schema({
  machine_location: {
    type: String,
    required: true,
  },
  farmstatus: {
    type: String,
    required: true,
  },
  smsAlertSent: {
    type: String,
    required: true,
  },
  alertSentAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});
export default mongoose.model("AlertHistory", AlertHistorySchema);
