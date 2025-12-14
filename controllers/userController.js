const StatusCodes = require("http-status-codes");

function register(req, res) {
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
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
