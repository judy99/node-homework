const express = require("express");
const errorHandler = require("./middleware/error-handler");
const errorHandlerNotFound = require("./middleware/not-found");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");
const prisma = require("./db/prisma");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
const cors = require("cors");

const app = express();

app.use((req, res, next) => {
  res.setHeader("X-DEPLOY-CHECK", "cors-v1");
  next();
});

app.set("trust proxy", 1);

const corsOptions = {
  origin: ["http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-TOKEN"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const allowedOrigin = "http://localhost:3001";
console.log("*****req.headers.origin:", req.headers.origin);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-TOKEN");
  }

  // preflight never hits auth/csrf
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

app.use(helmet());

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use(xss());

app.use((req, res, next) => {
  console.log("req.method: ", req.method);
  console.log("req.path: ", req.path);
  console.log("req.query: ", req.query);
  next();
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", analyticsRouter);

app.use(errorHandlerNotFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    // If you have DB connections, close them here
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
