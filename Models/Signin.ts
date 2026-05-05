import e from "express";
import mongoose from "mongoose";
import AutoincrementFactory from "mongoose-sequence";

const Autoincrement = AutoincrementFactory(mongoose);
const SigninSchema = new mongoose.Schema({
  __id: {
    type: Number,
    unique: true,
  },
  machinelocation: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },
  tokens: {
    type: [String],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  resetpasswordtoken: {
    type: String,
  },
  resetpasswordexpires: {
    type: Date,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});
SigninSchema.plugin(Autoincrement, { id: "signin_seq", inc_field: "__id" });
export default mongoose.model("Signin", SigninSchema);
