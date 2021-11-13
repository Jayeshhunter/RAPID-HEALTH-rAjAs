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
const client = new OAuth2Client(
  "171125153728-pd31fnftkqiq4o3803lgt6p9dhmodn21.apps.googleusercontent.com"
);
const appoint = require("../models/appointment");
const cron = require("node-cron");

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
        ...val,
        fromDate: new Date().getTime(),
        endDate: new Date().getTime() + 1,
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
    cron.schedule("0 0 10 * * *", async () => {
      medicine.map(async (val) => {
        if (
          new Date().getTime() >= val.fromDate &&
          new Date().getTime() <= val.endDate
        ) {
          const body = JSON.stringify({
            owner_id: "69280678",
            token: "MRLHgUrU7GQMjn7ZLJPTH3Tn",
            smtp_user_name: "smtp70171761",
            message: {
              html: `Hi this is a medical reminder for name: ${val.name} ,quantity: ${val.quantity} and frequency: ${val.frequency}`,
              text: "Hello this is a test",
              subject: "example subject",
              from_email: "noreply@rapidemail.rmlconnect.net",
              from_name: "rAjAs",
              to: [
                {
                  email: `${result[1].email}`,
                  name: `${result[1].fname}`,
                  type: "to",
                },
              ],
              headers: {
                "Reply-To": "noreply@rapidemail.rmlconnect.net",
                "X-Unique-Id": "id ",
              },
            },
          });

          const config = {
            method: "post",
            url: "https://rapidemail.rmlconnect.net/v1.0/messages/sendMail",
            headers: {
              "Reply-To": "message.reply@example.com",
              "X-Unique-Id": "id",
              "Content-Type": "application/json",
            },
            data: body,
          };

          const response = await axios(config);
        }
      });

      // console.log('running a task every minute');
    });

    res.status(200).json({ prescription: result[0] });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};
module.exports.getPrescription = async function (req, res) {
  const { id } = req.body;
  try {
    const pres = await prescription.findById(id);
    res.status(200).json({ prescription: pres });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};

module.exports.allAppointments = async function (req, res) {
  const { doctorId } = req.body;
  try {
    const allApp = await appoint.find({ doctorId });
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
      }
    );
    res.status(200).json({ message: appo });
  } catch (err) {
    res.status(401).json({ error: "Error" });
  }
};
