const User = require("../models/doctor");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const axios = require("axios");

const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  "171125153728-pd31fnftkqiq4o3803lgt6p9dhmodn21.apps.googleusercontent.com"
);
require("dotenv").config();

const doctor = require("./../models/doctor");
const appoint = require("./../models/appointment");
const patient = require("./../models/patient");
const presc = require("./../models/prescription");

function distance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = (Math.PI * lat1) / 180;
  var radlat2 = (Math.PI * lat2) / 180;
  var theta = lon1 - lon2;
  var radtheta = (Math.PI * theta) / 180;
  var dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  if (unit == "K") {
    dist = dist * 1.609344;
  }
  if (unit == "N") {
    dist = dist * 0.8684;
  }
  return dist;
}

module.exports.getDocData = async (req, res) => {
  const { date, lat, long } = req.body;
  Promise.all([
    doctor.find({}).exec(),
    appoint.find({ appointmentDate: date }).exec(),
  ])
    .then((results) => {
      // results is an array of the results of each promise, in order.
      // console.log(results[0]);
      const appoin = results[0].map((val) => {
        const number = results[1].map(
          (valApp) => valApp.doctorId === val._id
        ).length;
        // console.log(results[1]);
        return {
          val: val,
          appNumber: number,
          dist: distance(
            parseFloat(lat),
            parseFloat(long),
            parseFloat(val.lat),
            parseFloat(val.long),
            "K"
          ),
        };
      });

      appoin.sort((a, b) => (a.distance > b.distance ? 1 : -1));
      console.log(appoin);
      res.status(200).json({ appointments: appoin });
    })
    .catch((err) => {
      res.status(500).json({ error: "error in getting value" }); // res.sendStatus(500) might be better here.
    });
};

module.exports.addAppoint = async (req, res) => {
  const { reason, totalNumber, appointmentDate, doctorId, diagnosis } =
    req.body;

  try {
    const appointId = uuidv4();
    const meetUrl = "https://meet.google.com/lookup/" + appointId;

    const config = {
      method: "get",
      url: `https://rapidapi.rmlconnect.net:9443/bulksms/bulksms?username=rapid-Vo0c4020810000&password=617bf2db245383001100f899&type=0&dlr=1&destination=+919798833522&source=RMLPRD&message=Appointment details: ${appointId}, ${reason},
      ${meetUrl},
      ${totalNumber + 1},
      ${appointmentDate},
      ${doctorId},
      ${diagnosis}, `,
      headers: {},
      data: "",
    };

    const results = await Promise.all([
      appoint.create({
        appointId,
        patientId: req.user._id,
        reason,
        meetUrl,
        tokenNumber: totalNumber + 1,
        appointmentDate,
        doctorId,
        diagnosis,
      }),
      patient.findByIdAndUpdate(req.user._id, {
        $push: { appointMents: appointId },
      }),
      axios(config),
    ]);

    res.status(200).json({ status: "done", details: results[0] });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
module.exports.getAllAppoints = async function (req, res) {
  try {
    if (req.user.appointMents.length > 0) {
      const allAppoint = await appoint.findOne({ patientId: req.user._id });
      const upcomingAppoints = allAppoint.filter(
        (appoint) => appoint.appointmentDate.getTime() >= new Date().getTime()
      );
      const previousAppoints = allAppoint.filter(
        (appoint) => appoint.appointmentDate.getTime() < new Date().getTime()
      );
      res
        .status(200)
        .json({ upcomingAppoints: upcomingAppoints, previousAppoints });
    } else {
      res.status(200).json({ message: "No appointments" });
    }
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
module.exports.getSingleAppoint = async function (req, res) {
  const id = req.body.id;
  try {
    const appointDet = await appoint.findById(id);
    res.status(200).json({ details: appointDet });
  } catch (e) {
    res.status(404).json({ error: "not found" });
  }
};

module.exports.medicine = async function (req, res) {
  const id = req.params.id;
  try {
    const medic = await presc.findOne({ patientId: id });
    const meds = medic.medicine.filter((val) => {
      if (
        new Date().getTime() >= val.fromDate &&
        new Date().getTime() <= val.endDate
      ) {
        return val;
      }
    });
    res.status(200).json({ medicines: meds });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

module.exports.getMyDisease = async (req, res) => {
  const { searchData } = req.body;

  try {
    const config = {
      method: "GET",
      url: "https://priaid-symptom-checker-v1.p.rapidapi.com/issues",
      params: { language: "en-gb" },
      headers: {
        "x-rapidapi-host": "priaid-symptom-checker-v1.p.rapidapi.com",
        "x-rapidapi-key": "2aa5e5eb32msh88f9422e4f8e2b1p1f38cbjsn6c608a4f3740",
      },
    };

    await axios(config)
      .then((response) => {
        return response.data;
      })
      .then(async (firstData) => {
        const disId = firstData.find(({ Name }) => Name === searchData);
        const options = {
          method: "GET",
          url: `https://priaid-symptom-checker-v1.p.rapidapi.com/issues/${disId.ID}/info`,
          params: { language: "en-gb" },
          headers: {
            "x-rapidapi-host": "priaid-symptom-checker-v1.p.rapidapi.com",
            "x-rapidapi-key":
              "2aa5e5eb32msh88f9422e4f8e2b1p1f38cbjsn6c608a4f3740",
          },
        };
        await axios(options).then((response) => {
          console.log(response.data);
          res.status(200).json({ info: response.data });
        });
      });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};
