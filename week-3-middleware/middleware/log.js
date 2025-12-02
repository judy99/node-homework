// const path = require("path");

const logger = (req, res, next) => {
  const now = new Date();
  const date = now.toLocaleDateString("en-US");
  const time = now.toLocaleTimeString("en-US");
  const timestamp = `${date}, ${time}`;
  const { method, path, requestId } = req;
  console.log(`[${timestamp}]: ${method} ${path} (${requestId})`);
  next();
};
module.exports = logger;
