const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

const router = express.Router();
router.use(jwtMiddleware);
router.use(roleMiddleware);

router.route("/users/:id").get(getUserAnalytics);
router.route("/users").get(getUsersWithStats);
router.route("/tasks/search").get(searchTasks);

module.exports = router;
