const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const routes = require("./routes");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();

app.use(methodOverride("_method"));
// parse application/x-www-form-urlencoded

// mongodb+srv://creamzo:Hibricks@cluster0.vbywy.mongodb.net/creamzo
mongoose.connect(
  "mongodb+srv://hackDB:Jayesh@135@cluster0.lev68.mongodb.net/hackDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.use(
  "/public/uploads",
  express.static(path.join(__dirname, "public/uploads/"))
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(cors());

const Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single("image");

app.use("/", routes);

const port = process.env.PORT || 5000;

app.listen(port, (err) => {
  if (err) console.log(err);
  else console.log("Server running on PORT:", port);
});
