require("dotenv").config();
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
const client = new OAuth2Client(process.env.VERIFY_ID);

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
      url:
        process.env.BULK_SMS +
        `Appointment details: ${appointId}, ${reason},
      ${meetUrl},
      ${totalNumber + 1},
      ${appointmentDate},
      ${doctorId},
      ${diagnosis}, `,
      headers: {},
      data: "",
    };

    const data2 = JSON.stringify({
      phone: "+919798833522",
      text: `Appointment details: 
      Reason : ${reason} \n
      Meeting Url : ${meetUrl} \n
      TokenNumber : ${totalNumber + 1} \n
      Appointment date : ${appointmentDate} \n
      Diagnosis : ${diagnosis},`,
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
      doctor.findByIdAndUpdate(doctorId, {
        $push: { appointMents: appointId },
      }),
      axios(config),
      axios(config2),
    ]);

    res.status(200).json({ status: "done", details: results[0] });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
module.exports.getAllAppoints = async function (req, res) {
  try {
    if (req.user.appointMents.length > 0) {
      const allAppoint = await appoint.find({ patientId: req.user._id });
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
      url: process.env.SYMPTOM_URL,
      params: { language: "en-gb" },
      headers: {
        "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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
          url: process.env.SYMPTOM_URL + `/${disId.ID}/info`,
          params: { language: "en-gb" },
          headers: {
            "x-rapidapi-host": process.env.RAPIDAPI_HOST,
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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
module.exports.history = async (req, res) => {
  try {
    const result = await Promise.all([
      appoint.find({ patientId: req.user._id }),
      presc.find({ patientId: req.user._id }),
    ]);
    const prevApp = result[0].filter((val) => {
      if (new Date().getTime() > val.appointmentDate.getTime()) {
        return val;
      }
    });
    res.status(200).json({ prev: prevApp, presc: result[1] });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

module.exports.pharmacies = async (req, res) => {
  const { lat, long } = req.params;
  try {
    const options = {
      method: "GET",
      url: process.env.GEOCODING,
      params: {
        lat: lat,
        lon: long,
        "accept-language": "en",
        polygon_threshold: "0.0",
      },
      headers: {
        "x-rapidapi-host": process.env.GEO_HOST,
        "x-rapidapi-key": process.env.GEO_KEY,
      },
    };

    const response = await axios(options);
    // res.status(200).json({ data: response.data });
    const location = response.data.address.city;

    const config = {
      method: "GET",
      url: process.env.JD_URL,
      params: { search_term: "pharmacy", location: location, page_number: "1" },
      headers: {
        "x-rapidapi-host": process.env.JDRAPIDAPI_HOST,
        "x-rapidapi-key": process.env.JDRAPIDAPI_KEY,
      },
    };
    const resp = await axios(config);
    res.status(200).json({ pharmacies: resp.data });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
module.exports.labs = async function (req, res) {
  const location = req.params.location;
  try {
    const config = {
      method: "GET",
      url: process.env.JD_URL,
      params: { search_term: "labs", location: location, page_number: "1" },
      headers: {
        "x-rapidapi-host": process.env.JDRAPIDAPI_HOST,
        "x-rapidapi-key": process.env.JDRAPIDAPI_KEY,
      },
    };
    const resp = await axios(config);
    res.status(200).json({ labs: resp.data });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
