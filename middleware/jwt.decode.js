const jwt = require("jsonwebtoken");
const response = require("../json/json.response");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return response(res, 401, "invalid token", null);
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return response(res, 401, "invalid token format", null);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return response(res, 401, "invalid or expired token", null);
  }
};
