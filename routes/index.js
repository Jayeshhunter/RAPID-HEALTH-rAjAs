const express = require("express");
const router = express.Router();

const appointDoct = require("./appointDoct");
const appointPat = require("./appointPat");
const docAuth = require("./docRoutes");
const patAuth = require("./patRoutes");

router.use("/appDoc", appointDoct);
router.use("/appPat", appointPat);
router.use("/doc", docAuth);
router.use("/pat", patAuth);

module.exports = router;
