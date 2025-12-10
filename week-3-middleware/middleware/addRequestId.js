const { v4: uuidv4 } = require("uuid");

const addRequestId = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  res.set("X-Request-Id", requestId);
  req.requestId = requestId;
  next();
};

module.exports = addRequestId;
