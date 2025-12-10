const { StatusCodes } = require("http-status-codes");

module.exports = (req, res, next) =>
  !global.user_id
    ? res.status(StatusCodes.UNAUTHORIZED).json({ message: "UNAUTHORIZED" })
    : next();
