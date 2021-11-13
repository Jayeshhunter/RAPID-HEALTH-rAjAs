const { Router } = require("express");
const appDocController = require("../controllers/appDocController");
const router = Router();
const mongoose = require("mongoose");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const { checkDoc } = require("../middlewares/docAuth");

router.post("/addPrescription", checkDoc, appDocController.addPrescription);
router.get("/getPrescription", checkDoc, appDocController.getPrescription);
router.get("/allAppointments", checkDoc, appDocController.allAppointments);
router.post("/reschedule", checkDoc, appDocController.reschedule);
router.post("/pendSt", checkDoc, appDocController.pendSt);

module.exports = router;
