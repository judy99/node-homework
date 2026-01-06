const express = require("express");
const {
  userProductivity,
  userTasks,
} = require("../controllers/analyticController");

const router = express.Router();
router.route("/users/:id").get(userProductivity);
router.route("/users").get(userTasks);

module.exports = router;
