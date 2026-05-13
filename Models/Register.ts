import mongoose from "mongoose";
// import AutoincrementFactory from "mongoose-sequence";
// const autoincrement = AutoincrementFactory(mongoose);

const RegisterSchema = new mongoose.Schema({
  machine_location: {
    type: String,
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
    type: String,
    required: true,
  },

  token: {
    type: String,
    required: false,
  },

  timeStamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// RegisterSchema.plugin(autoincrement, {
//   id: "register_seq",
//   inc_field: "_id",
// });

const Register = mongoose.model("Register", RegisterSchema);

export default Register;
