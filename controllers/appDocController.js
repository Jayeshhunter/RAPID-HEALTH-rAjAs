const doctor = require("../models/doctor");
const patient = require("../models/patient");
const prescription = require("../models/prescription");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { uuid } = require("uuidv4");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const appoint = require("../models/appointment");
const cron = require("node-cron");
require("dotenv").config();
const client = new OAuth2Client(process.env.VERIFY_ID);
module.exports.addPrescription = async (req, res) => {
  const {
    patientId,
    appointId,
    curDiagnosis,
    knowDiagnosis,
    medicine,
    testRequired,
    nextAppointRec,
  } = req.body;
  try {
    medicine.map((val) => {
      return {
        name: val.name,
        frequency: val.frequency,
        foodStat: val.foodStat,
        quantity: val.quantity,
        duration: val.duration,
        fromDate: new Date().getTime(),
        endDate: new Date().getTime() + val.duration,
      };
    });

    const result = await Promise.all([
      prescription.create({
        appointId,
        patientId,
        doctorId: req.user._id,
        curDiagnosis,
        knowDiagnosis,
        medicine,
        testRequired,
        nextAppointRec,
      }),
      patient.findByIdAndUpdate(patientId, {
        $push: { medAlert: { $each: medicine } },
      }),
    ]);

    const data3 = JSON.stringify({
      phone: "+919798833522",
      text: `Prescription : \n
      current Diagnosis: ${result[0].curDiagnosis} \n 
      medicine: ${result[0].medicine} \n testRequired: ${result[0].testRequired}`,
    });

    const config3 = {
      method: "post",
      url: process.env.RAPID_WBM,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTH_TOKEN,
      },
      data: data3,
    };

    const resultAx = await axios(config3);

    cron.schedule("0 0 10 * * *", async () => {
      medicine.map(async (val) => {
        if (
          new Date().getTime() >= val.fromDate &&
          new Date().getTime() <= val.endDate
        ) {
          const body = JSON.stringify({
            owner_id: process.env.OWNER_ID,
            token: process.env.MAIL_TOKEN,
            smtp_user_name: process.env.SMTP_USERNAME,
            message: {
              html: `Hi this is a medical reminder for name: ${val.name} ,quantity: ${val.quantity} and frequency: ${val.frequency}`,
              text: "Hello this is a test",
              subject: "example subject",
              from_email: process.env.RAPID_EMAIL,
              from_name: "rAjAs",
              to: [
                {
                  email: `${result[1].email}`,
                  name: `${result[1].fname}`,
                  type: "to",
                },
              ],
              headers: {
                "Reply-To": process.env.RAPID_EMAIL,
                "X-Unique-Id": "id ",
              },
            },
          });

          const config = {
            method: "post",
            url: process.env.RAPID_MAILURL,
            headers: {
              "Reply-To": "message.reply@example.com",
              "X-Unique-Id": "id",
              "Content-Type": "application/json",
            },
            data: body,
          };
          const data2 = JSON.stringify({
            phone: "+919798833522",
            text: `Medicine reminder: 
            name: ${val.name} ,quantity: ${val.quantity} and frequency: ${val.frequency}`,
          });

          const config2 = {
            method: "post",
            url: process.env.RAPID_WBM,
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.AUTH_TOKEN,
            },
            data: data2,
          };
          const resultAx = await Promise.all([axios(config), axios(config2)]);
        }
      });
    });

    res.status(200).json({ prescription: result[0] });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
module.exports.getPrescription = async function (req, res) {
  const { id } = req.body;
  try {
    const pres = await prescription.findOne({ appointId: id });
    res.status(200).json({ prescription: pres });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};

module.exports.allAppointments = async function (req, res) {
  // const { doctorId } = req.body;
  try {
    const allApp = await appoint.find({ doctorId: req.user._id });
    res.status(200).json({ appointment: allApp });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};

module.exports.reschedule = async function (req, res) {
  const { appointId, status, date, rescheduleReas } = req.body;
  try {
    const appo = await appoint.findOneAndUpdate(
      { appointId },
      {
        appointmentDate: date,
        rescheduledAt: status,
        approved: true,
        rescheduleReas,
      },
      {
        returnOriginal: false,
        new: true,
      }
    );
    res.status(200).json({ message: appo });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};
module.exports.pendSt = async function (req, res) {
  const { appointId, status } = req.body;
  try {
    const appo = await appoint.findOneAndUpdate(
      { appointId },
      {
        status,
        //status after completion
      },
      {
        returnOriginal: false,
        new: true,
      }
    );
    res.status(200).json({ message: appo });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};
