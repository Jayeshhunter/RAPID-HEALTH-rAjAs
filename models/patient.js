const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String },
  email: { type: String, required: true, unique: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  password: { type: String, required: true },
  imgUrl: { type: String, default: "" }, //history upload
  address: { type: String, default: "" },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  lat: { type: String, required: true },
  long: { type: String, required: true },
  appointMents: { type: [String], default: [] },
  medAlert: [],
});

userSchema.statics.login = async function (email) {
  const user = await this.findOne({ email: email });
  if (user) {
    return user;
  }
  throw Error("incorrect id");
};

const User = new mongoose.model("patient", userSchema);

module.exports = User;
