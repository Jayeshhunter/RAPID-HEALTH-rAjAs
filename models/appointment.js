const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  appointId: { type: String, required: true },
  patientId: { type: String, required: true },
  reason: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  appointmentDate: { type: Date, required: true },
  doctorId: { type: String, required: true },
  diagnosis: { type: String, required: true },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  meetUrl: { type: String, default: "" },
  approved: { type: Boolean, default: false },
  rescheduledAt: { type: Boolean, default: false },
  rescheduleReas: { type: String, default: "" },
  status: { type: Boolean, default: false },
});
//status true meaning completed else pending

const Appoint = new mongoose.model("appoint", userSchema);

module.exports = Appoint;
