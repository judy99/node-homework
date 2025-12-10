const StatusCodes = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");

function register(req, res) {
  if (!req.body) req.body = {};
  const newUser = { ...req.body }; // this makes a copy
  const { error, value } = userSchema.validate(newUser, { abortEarly: false });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  global.users.push(value);
  global.user_id = value; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body);
}

function logon(req, res) {
  const user = global.users.find((user) => user.email === req.body.email);
  if (user && user.password === req.body.password) {
    global.user_id = user; // the user is set to logged on.
    return res
      .status(StatusCodes.OK)
      .json({ name: user.name, email: user.email });
  }
  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: "Authentication Failed" });
}

function logoff(req, res) {
  global.user_id = null; // the user is set to null.
  res.sendStatus(StatusCodes.OK);
}

module.exports = { register, logon, logoff };
