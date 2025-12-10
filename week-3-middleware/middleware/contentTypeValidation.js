const { ValidationError } = require("../errors");

const validateContentType = (req, res, next) => {
  if (req.method === "POST" && req.get("content-type") !== "application/json") {
    throw new ValidationError(
      `Content-Type must be application/json. requestId: ${req.requestId}`
    );
  }
  next();
};
module.exports = validateContentType;
