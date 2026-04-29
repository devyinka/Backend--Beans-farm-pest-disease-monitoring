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
  timeStamp: {
    type: Date,
    default: Date.now,
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
  rainLevel: {
    type: Number,
    required: true,
  },
  soilMoisture: {
    type: Number,
    required: true,
  },
  lightLevel: {
    type: Number,
    required: true,
  },
  soilPH: {
    type: Number,
    required: true,
  },
});

RawsensorsSchema.plugin(Autoincrement, {
  id: "rawsensors_seq",
  inc_field: "__id",
});

const Rawsensors = mongoose.model("Rawsensors", RawsensorsSchema);

export default Rawsensors;
