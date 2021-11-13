const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  age: { type: Date, required: true },
  password: { type: String, required: true },
  imgUrl: { type: String, default: "" },
  info: { type: String, required: true },
  experience: {
    type: String,
    required: true,
  },
  speciality: { type: String, required: true },
  gender: { type: String, required: true },

  resume: { type: String, required: true },
  lat: { type: String, required: true },
  long: { type: String, required: true },
});

userSchema.statics.login = async function (email) {
  const user = await this.findOne({ email: email });
  if (user) {
    return user;
  }
  throw Error("incorrect");
};

const Doctor = new mongoose.model("doctor", userSchema);

module.exports = Doctor;
