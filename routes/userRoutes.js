const express = require("express");
const {
  register,
  logon,
  logoff,
  show,
} = require("../controllers/userController");

const router = express.Router();
router.route("/").post(register);
router.route("/:id").get(show);
router.route("/logon").post(logon);
router.route("/logoff").post(logoff);

module.exports = router;
