const response = require("../json/json.response");

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return response(res, 401, "permission denied", null);
    }

    next();
  };
}

module.exports = allowRoles;
