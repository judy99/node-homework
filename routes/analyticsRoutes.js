const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

const router = express.Router();
router.use(jwtMiddleware);
router.route("/users/:id").get(getUserAnalytics);
router.route("/users").get(getUsersWithStats);
router.route("/tasks/search").get(searchTasks);

module.exports = router;
