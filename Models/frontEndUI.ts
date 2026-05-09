import mongoose from "mongoose";

const FrontEndUISchema = new mongoose.Schema({
  machine_location: {
    type: String,
    required: true,
  },
  sensors: [
    {
      _id: false,
      id: { type: String, required: true },
      label: { type: String, required: true },
      value: { type: Number, required: true, default: 0 },
      unit: { type: String, required: true },
    },
  ],
  datainterval: { type: Number, default: 30 },
  AIData: {
    ui_status: { type: String, default: "healthy" },
    ui_title: { type: String, default: "Awaiting Data" },
    spray_action: { type: String, default: "No action required." },
    description: { type: String, default: "Fetching latest analysis..." },
    confidence: { type: Number, default: 0 },
    sms_alert_sent: { type: Boolean, default: false },
  },
  farmInfo: {
    name: { type: String, default: "Unknown Location" },
    location: { type: String, default: "Unknown Location" },
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("FrontEndUI", FrontEndUISchema);
