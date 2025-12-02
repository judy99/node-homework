const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors");

const errorNotFound = (req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
};

module.exports = errorNotFound;
