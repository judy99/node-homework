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
const validateContentType = require("./middleware/contentTypeValidation");

const dogsRouter = require("./routes/dogs");
const logger = require("./middleware/log");
const errorNotFound = require("./middleware/errorNotFound");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(addRequestId);
app.use(logger);
app.use(validateContentType);

app.use("/", dogsRouter); // Do not remove this line

app.use(errorNotFound);
app.use(errorHandler);

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000")
);
module.exports = server;
