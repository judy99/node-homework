const { StatusCodes } = require("http-status-codes");
const { UnauthorizedError, ValidationError } = require("../errors");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(
    "************Error****************\n",
    err.constructor.name,
    JSON.stringify(err, ["name", "message", "stack"])
  );

  if (!res.headersSent) {
    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
      return res.status(err.statusCode).send(err.message);
    } else {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(err.message || "An internal server error occurred.");
    }
  }
};

module.exports = errorHandlerMiddleware;
