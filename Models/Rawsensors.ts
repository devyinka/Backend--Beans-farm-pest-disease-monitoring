import mongoose from "mongoose";

const RawsensorsSchema = new mongoose.Schema({
  __id: {
    type: Number,
    unique: true,
  },
  machine_location: {
    type: String,
    required: true,
  },

  temperature: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  rain_level: {
    type: Number,
    required: true,
  },
  soil_moisture: {
    type: Number,
    required: true,
  },
  light_level: {
    type: Number,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Rawsensors = mongoose.model("Rawsensors", RawsensorsSchema);

export default Rawsensors;
