import mongoose from "mongoose";

const SprayingActionSchema = new mongoose.Schema({
  machine_location: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: Boolean,
    required: true,
  },
    status: {
    type: String,
    enum: ["disease", "pest"],
    required: true,
  },    
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

export default mongoose.model("SprayingAction", SprayingActionSchema);