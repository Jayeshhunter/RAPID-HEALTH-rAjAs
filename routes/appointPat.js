const { Router } = require("express");
const appPatController = require("../controllers/appPatController");
const router = Router();
const mongoose = require("mongoose");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const { checkPat } = require("../middlewares/patAuth");

router.post("/getDocData", checkPat, appPatController.getDocData);
router.post("/addAppoint", checkPat, appPatController.addAppoint);
router.get("/getMyAppoint", checkPat, appPatController.getAllAppoints);
router.post("/getSingleAppoint", checkPat, appPatController.getSingleAppoint);
router.post("/getMyDisease", checkPat, appPatController.getMyDisease);
router.get("/medicine/:id", checkPat, appPatController.medicine);
router.get("/history", checkPat, appPatController.history);
router.get("/pharmacies/:lat/:long", checkPat, appPatController.pharmacies);
router.get("/labs/:location", checkPat, appPatController.labs);

//previous appointment and prescription

module.exports = router;
