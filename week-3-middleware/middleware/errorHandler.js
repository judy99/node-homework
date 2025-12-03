const { StatusCodes } = require("http-status-codes");
const loggerHelper = require("../loggerHelper");
const {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} = require("../errors");

const errorHandler = (err, req, res, next) => {
  loggerHelper(req, err);

  if (!res.headersSent) {
    if (
      err instanceof NotFoundError ||
      err instanceof ValidationError ||
      err instanceof UnauthorizedError
    ) {
      return res.status(err.statusCode).json({
        error: err.message,
        requestId: req.requestId,
      });
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        requestId: req.requestId,
      });
    }
  }
};

module.exports = errorHandler;
