var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var router = express.Router();

var ROLES = require("../../../constants/roles");
var STATUS = require("../../../constants/status");
var User = require("../../../models/user.model");
var {
  jsonResponse: response,
  publicUser,
} = require("../../../json/json.response");

// register
router.post("/register", async function (req, res) {
  try {
    const { username, password, role } = req.body;
    const allowedRoles = [ROLES.USER, ROLES.SHOP];

    if (!username || !password || !role) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (!allowedRoles.includes(role)) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      isApprove: false,
    });

    return response(res, 201, STATUS.CreateSuccess, publicUser(user));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// login
router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const user = await User.findOne({ username });
    if (!user) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (!user.isApprove) {
      return response(res, 401, STATUS.NotHavePermission, null);
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return response(res, 200, STATUS.Success, {
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

module.exports = router;
