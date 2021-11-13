const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  appointId: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  curDiagnosis: { type: String, required: true },
  knowDiagnosis: { type: String, required: true },
  medicine: [
    {
      name: String,
      frequency: String,
      foodStat: String,
      quantity: String,
      duration: Number,
      fromDate: Number,
      endDate: Number,
    },
  ],
  testRequired: { type: String, required: true },
  nextAppointRec: { type: String, required: true },
});
//status true meaning completed else pending

const Presc = new mongoose.model("presc", userSchema);

module.exports = Presc;
