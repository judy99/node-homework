const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} = require("./errors");
const errorHandler = require("./middleware/errorHandler");
const addRequestId = require("./middleware/addRequestId");
const dogsRouter = require("./routes/dogs");
const logger = require("./middleware/log");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(addRequestId);
app.use(logger);

app.use((req, res, next) => {
  if (req.method === "POST" && req.get("content-type") !== "application/json") {
    throw new ValidationError(
      `Content-Type must be application/json. requestId: ${req.requestId}`
    );
  }
  next();
});

app.use("/", dogsRouter); // Do not remove this line

// not found
app.use((req, res) => {
  throw new NotFoundError(`Route not found or not available. ${req.requestId}`);
});
app.use(errorHandler);

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000")
);
module.exports = server;
