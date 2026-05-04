import mongoose from "mongoose";
import AutoincrementFactory from "mongoose-sequence";

const Autoincrement = AutoincrementFactory(mongoose);

const RawsensorsSchema = new mongoose.Schema({
  __id: {
    type: Number,
    required: true,
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
  soil_ph: {
    type: Number,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

RawsensorsSchema.plugin(Autoincrement, {
  id: "rawsensors_seq",
  inc_field: "__id",
});

const Rawsensors = mongoose.model("Rawsensors", RawsensorsSchema);

export default Rawsensors;
