module.exports = async (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No roles assigned." });
  }

  const userRoles = req.user.roles.split(";").map((role) => role.trim());

  if (userRoles.includes("manager")) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Manager access required." });
  }
};
