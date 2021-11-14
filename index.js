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
const rateLimit = require("express-rate-limit");
const app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server);

app.use(methodOverride("_method"));

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
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

io.on("connection", (socket) => {
  socket.on("join-room", (room, user) => {
    socket.join(room);
    // console.log(room);
    socket.broadcast
      .to(room)
      .emit("user-connected", `user connected ${room}`, room, user);

    socket.on("disconnect", () => {
      socket.broadcast.to(room).emit("user-disconnected", user);
    });
    socket.on("message", (msg) => {
      socket.broadcast.to(room).emit("sending", msg);
    });
  });
});

server.listen(port, (err) => {
  if (err) console.log(err);
  else console.log("Server running on PORT:", port);
});
