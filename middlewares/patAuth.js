const jwt = require("jsonwebtoken");
const User = require("../models/patient");
require("dotenv").config();

const checkPat = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    // req.token = bearerToken;

    jwt.verify(
      bearerToken,
      process.env.SECRET_KEY,
      async (err, decodedToken) => {
        if (err) {
          res.status(401).json({ error: "jwt invalid" });
        } else {
          let user = await User.findById(decodedToken.id);
          if (user) {
            req.user = user;
            next();
          } else {
            res.status(401).json({ error: "user not found" });
          }
        }
      }
    );
  } else {
    res.status(401).json({ error: "token missing" });
  }
};

module.exports = { checkPat };
