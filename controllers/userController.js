const StatusCodes = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  value.hashedPassword = await hashPassword(value.password);
  const { name, email, hashedPassword } = value;

  let user = null;
  try {
    user = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { name: true, email: true, id: true }, // specify the column values to return
    });
    global.user_id = user.id;
    return res
      .status(StatusCodes.CREATED)
      .json({ name: user.name, email: user.email });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code == "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email was already registered" });
    } else {
      return next(err); // the error handler takes care of other erors
    }
  }
}

async function logon(req, res) {
  if (!req.body) req.body = {};
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required." });
  }

  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  const user = await prisma.user.findUnique({ where: { email } });

  const storedHash = user.hashedPassword || user.hashed_password;

  if (!user || !storedHash) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  try {
    if (user) {
      const isMatch = await comparePassword(password, storedHash);
      if (isMatch) {
        global.user_id = user.id; // the user is set to logged on.
        return res
          .status(StatusCodes.OK)
          .json({ name: user.name, email: user.email });
      }
    }
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
}

function logoff(req, res) {
  global.user_id = null; // the user is set to null.
  return res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
