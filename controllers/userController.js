const StatusCodes = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");

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

  let user = null;
  value.hashed_password = await hashPassword(value.password);
  try {
    user = await pool.query(
      `INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    );
    // note that you use a parameterized query
    global.user_id = user.rows[0].id;
    return res
      .status(StatusCodes.CREATED)
      .json({ name: user.rows[0].name, email: user.rows[0].email });
  } catch (e) {
    // the email might already be registered
    if (e.code === "23505") {
      return res.status(400).json({ message: "Email is already registered." });
      // this means the unique constraint for email was violated
      // here you return the 400 and the error message.  Use a return statement, so that
      // you don't keep going in this function
    }
    return next(e); // all other errors get passed to the error handler
  }
  // othewise newUser now contains the new user.  You can return a 201 and the appropriate
  // object.  Be sure to also set global.user_id with the id of the user record you just created.
}

async function logon(req, res) {
  if (!req.body) req.body = {};
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required." });
  }

  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (!result.rows.length) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  const user = result.rows[0];
  try {
    if (user) {
      const isMatch = await comparePassword(password, user.hashed_password);
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
