import mongoose from "mongoose";

const AlertHistorySchema = new mongoose.Schema({
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  machine_location: {
    type: String,
    required: true,
  },
  farmstatus: {
    type: String,
    required: true,
  },
  smsAlertSent: {
    type: Boolean,
    required: true,
  },
  alertSentAt: {
    type: Date,
    required: true,
  },
  farmer_aknowledge: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
});
export default mongoose.model("AlertHistory", AlertHistorySchema);
