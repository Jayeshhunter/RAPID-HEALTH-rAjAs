const User = require("../models/patient");
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
const doctor = require("./../models/doctor");
const appoint = require("./../models/appointment");
require("dotenv").config();
// 427485028588-om8pntnhnqnbrpot8olei5dtvmsjatng.apps.googleusercontent.com
const saltRounds = 10;

const maxAge = 8 * 24 * 60 * 60;
const createToken = function (id) {
  return jwt.sign({ id }, "secretkey", {
    expiresIn: maxAge,
  });
};

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

module.exports.generate_otp = async (req, res) => {
  const { email } = req.body;
  try {
    const uid = Math.floor(1000 + Math.random() * 9000);
    const body = JSON.stringify({
      owner_id: "69280678",
      token: "MRLHgUrU7GQMjn7ZLJPTH3Tn",
      smtp_user_name: "smtp70171761",
      message: {
        html: `${uid}`,
        text: "Hello this is a test",
        subject: "example subject",
        from_email: "noreply@rapidemail.rmlconnect.net",
        from_name: "rAjAs",
        to: [
          {
            email: `${email}`,
            name: "Jayesh Jayanandan",
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

    console.log(response.data);
    res.status(200).json({ email, uid: uid });
  } catch (e) {
    res.status(401).json({ error: "Mail not send" });
  }
};

module.exports.signup_post = async (req, res) => {
  const { email, password, fname, lname, age, gender, lat, long } = req.body;
  //   console.log(req.body);
  //   const creamzoId = uuid();
  bcrypt.hash(password, saltRounds, async function (err, hash) {
    try {
      const member = await User.create({
        email,
        password: hash,
        fname,
        lname,
        age,
        gender,
        lat,
        long,
      });
      const token = createToken(member._id);
      res.status(200).json({ token: token, maxAge: maxAge });
    } catch (err) {
      // console.log(err);
      res.status(400).json({ error: err });
    }
  });
};

module.exports.google_post = (req, res) => {
  const idToken = req.body.tokenId;
  client
    .verifyIdToken({
      idToken,
      audience:
        "171125153728-pd31fnftkqiq4o3803lgt6p9dhmodn21.apps.googleusercontent.com",
    })
    .then((response) => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email: email }, (err, user) => {
          if (err) {
            res.status(400).json({ error: "error while creating" });
          } else {
            if (user) {
              const token = createToken(user._id);
              res.status(200).json({ token: token, user: user, maxAge });
            } else {
              let creamzoId = uuid();
              let password = email + "secretkey";
              let newUser = new User({
                fname: name,
                email: email,
                password: password,
                creamzoId: creamzoId,
              });
              newUser.save((err, data) => {
                if (err) {
                  return res
                    .status(400)
                    .json({ error: "error while creating" });
                }
                const token = createToken(data._id);
                res.status(200).json({ token: token, user: data, maxAge });
              });
            }
          }
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({ error: err.message });
    });
};

module.exports.login_post = async (req, res) => {
  const { email, passwd } = req.body;
  try {
    const user = await User.login(email);
    const token = createToken(user._id);
    bcrypt.compare(passwd, user.password, function (err, result) {
      if (result) {
        res.status(200).json({ user: user, token, maxAge });
      } else {
        res.status(400).json({ error: "incorrect Password" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "user doesn't exist" });
  }
};
module.exports.verify_post = async (req, res) => {
  // const token = req.body.jwt;
  res.status(200).json({ user: req.user });
};

module.exports.forgot_post = async (req, res) => {
  const { email } = req.body;
  try {
    const uid = Math.floor(1000 + Math.random() * 9000);
    //  uid to be replaced with url of the frontend forgot
    const user = await User.login(email);
    const body = JSON.stringify({
      owner_id: "69280678",
      token: "MRLHgUrU7GQMjn7ZLJPTH3Tn",
      smtp_user_name: "smtp70171761",
      message: {
        html: `${uid}`,
        text: "Hello this is a test",
        subject: "example subject",
        from_email: "noreply@rapidemail.rmlconnect.net",
        from_name: "rAjAs",
        to: [
          {
            email: `${email}`,
            name: "Jayesh Jayanandan",
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

    console.log(response.data);
    res.status(200).json({ message: "Mail sent", user, otp: uid });
  } catch (err) {
    res.status(400).json({ error: "Incorrect mailId" });
  }
};

module.exports.reset_post = (req, res) => {
  const { passwd } = req.body;
  const email = req.params.email;

  bcrypt.hash(passwd, saltRounds, async function (err, hash) {
    try {
      const user = await User.findOneAndUpdate(
        { email: email },
        {
          password: hash,
        }
      );
      res.status(200).json({ message: "password resetted" });
    } catch (err) {
      res.status(400).json({ error: "error in resetting password" });
    }
  });
};
module.exports.edit_post = async (req, res) => {
  // const email = req.params.doc;
  console.log(req.user);
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        imgUrl: process.env.URL + "/image/" + req.file.filename,
      },
      {
        returnOriginal: false,
        new: true,
      }
    );
    // const allPins = await Pin.find().sort({ createdAt: -1 });
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json(err.message);
  }
};
module.exports.editwithout_post = async (req, res) => {
  // const id = req.body.creamzoId;
  // console.log(id);
  // console.log();

  const { email, fname, lname, age, gender } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        email,
        fname,
        lname,
        age,
        gender,
      }
    );
    console.log(user);
    // const allPins = await Pin.find().sort({ createdAt: -1 });
    res.status(200).json({ user: user });
  } catch (err) {
    res.status(400).json(err.message);
  }
};
module.exports.getImg = (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length == 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }

    if (
      file.contentType == "image/jpeg" ||
      file.contentType == "image/png" ||
      file.contentType == "video/mp4"
    ) {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }
  });
};
module.exports.getPatient = async function (req, res) {
  const id = req.params.id;
  try {
    const patient = await User.findById(id);
    res.status(200).json(patient);
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
};
