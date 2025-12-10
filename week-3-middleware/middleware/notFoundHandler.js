const { StatusCodes } = require("http-status-codes");

const errorNotFound = (req, res) => {
  if (!res.headersSent) {
    console.log(StatusCodes.NOT_FOUND);
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Route not found",
      requestId: req.requestId,
    });
  }
};

module.exports = errorNotFound;
