module.exports = async (req, res, next) => {
  if (!req.user || !req.user.roles.length) {
    return res.status(401).json({
      message:
        "Unauthorized: No user is authenticated or user has no roles assigned.",
    });
  }

  const userRoles = req.user.roles.split(";").map((role) => role.trim());

  if (userRoles.includes("manager")) {
    next();
  } else {
    res
      .status(403)
      .json({
        message:
          "Forbidden: You do not have permission to access this resource.",
      });
  }
};
