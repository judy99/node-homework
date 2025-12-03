const express = require("express");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const addRequestId = require("./middleware/addRequestId");
const validateContentType = require("./middleware/contentTypeValidation");

const dogsRouter = require("./routes/dogs");
const logger = require("./middleware/logger");
const notFoundHandler = require("./middleware/notFoundHandler");
const addSecurityHeaders = require("./middleware/addSecurityHeaders");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(addRequestId);
app.use(logger);
app.use(addSecurityHeaders);
app.use(validateContentType);

app.use("/", dogsRouter); // Do not remove this line

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000")
);
module.exports = server;
