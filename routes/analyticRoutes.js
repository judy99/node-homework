const express = require("express");
const {
  userProductivity,
  userTasks,
  taskSearch,
} = require("../controllers/analyticsController");

const router = express.Router();
router.route("/users/:id").get(userProductivity);
router.route("/users").get(userTasks);
router.route("/tasks/search").get(taskSearch);

module.exports = router;
