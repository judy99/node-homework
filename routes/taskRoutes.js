const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {
  create,
  deleteTask,
  index,
  update,
  show,
  bulkCreate,
} = require("../controllers/taskController");

const router = express.Router();
router.use(jwtMiddleware);
router.route("/").get(index);
router.route("/bulk").post(bulkCreate);
router.route("/:id").get(show);
router.route("/").post(create);
router.route("/:id").delete(deleteTask);
router.route("/:id").patch(update);

module.exports = router;
