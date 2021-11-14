const { Router } = require("express");
const authController = require("../controllers/patAuthController");
const router = Router();
const mongoose = require("mongoose");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const patAuth = require("../middlewares/patAuth");

const mongoURI =
  "mongodb+srv://hackDB:Jayesh@135@cluster0.lev68.mongodb.net/hackDB";
const promise = mongoose.connect(mongoURI, { useNewUrlParser: true });

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn, mongoose.mongo);
  gfs.collection("uploads");
});

// Create storage engine
const storage = new GridFsStorage({
  db: promise,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage }).single("image");

router.post("/signup", authController.signup_post);
router.post("/login", authController.login_post);
router.post("/otp", authController.generate_otp);
router.post("/forgot", authController.forgot_post);
router.post("/reset/:email", authController.reset_post);
router.post("/edit", patAuth.checkPat, upload, authController.edit_post);
router.post("/editWithout", patAuth.checkPat, authController.editwithout_post);
router.get("/verify", patAuth.checkPat, authController.verify_post);
router.get("/image/:filename", authController.getImg);
router.get("/patient/:id", authController.getPatient);

module.exports = router;
