import mongoose from "mongoose";
import AutoincrementFactory from "mongoose-sequence";

const Autoincrement = AutoincrementFactory(mongoose);

const FrontEndUISchema = new mongoose.Schema({
  _id: {
    type: Number,
    unique: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  machine_location: {
    type: String,
    required: true,
  },
  sensors: [
    {
      id: { type: String, required: true },
      label: { type: String, required: true },
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
  ],
  AIData: {
    ui_status: { type: String, required: true },
    ui_title: { type: String, required: true },
    spray_action: { type: String, required: true },
    description: { type: String, required: true },
    confidence: { type: Number, required: true },
    sms_alert_sent: { type: Boolean, required: true },
  },
  farmInfo: {
    name: { type: String, required: true },
    location: { type: String, required: true },
  },
});

FrontEndUISchema.plugin(Autoincrement, {
  id: "front_end_ui_seq",
  inc_field: "_id",
});

export default mongoose.model("FrontEndUI", FrontEndUISchema);
