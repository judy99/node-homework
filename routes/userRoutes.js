const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {
  register,
  logon,
  logoff,
  show,
} = require("../controllers/userController");

const router = express.Router();
router.route("/register").post(register);

router.use(jwtMiddleware);
router.route("/logon").post(logon);
router.route("/logoff").post(logoff);
router.route("/:id").get(show);

module.exports = router;
