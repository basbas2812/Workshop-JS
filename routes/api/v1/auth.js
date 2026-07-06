var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var router = express.Router();

var User = require("../../../models/user.model");
var response = require("../../../json/json.response");

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    isApprove: user.isApprove,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// register
router.post("/register", async function (req, res) {
  try {
    const { username, password, role } = req.body;
    const allowedRoles = ["user", "shop"];

    if (!username || !password || !role) {
      return response(res, 400, "username, password and role are required", null);
    }

    if (!allowedRoles.includes(role)) {
      return response(res, 400, "role must be user or shop", null);
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return response(res, 400, "username already exists", null);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      isApprove: false,
    });

    return response(res, 201, "success", publicUser(user));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// login
router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return response(res, 400, "username and password are required", null);
    }

    const user = await User.findOne({ username });
    if (!user) {
      return response(res, 400, "user not found", null);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response(res, 400, "invalid password", null);
    }

    if (!user.isApprove) {
      return response(res, 401, "account is waiting for approve", null);
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return response(res, 200, "success", {
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

module.exports = router;
