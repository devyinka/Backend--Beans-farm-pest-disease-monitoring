import mongoose from "mongoose";

const RegisterSchema = new mongoose.Schema({
  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    unique: true,
  },
  lastName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  machine_location: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const Register = mongoose.model("Register", RegisterSchema);

export default Register;
