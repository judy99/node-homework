const loggerHelper = require("../loggerHelper");

const logger = (req, res, next) => {
  loggerHelper(req);
  next();
};
module.exports = logger;
