var express = require("express");
var mongoose = require("mongoose");
var router = express.Router();

var User = require("../../../models/user.model");
var auth = require("../../../middleware/jwt.decode");
var allowRoles = require("../../../middleware/role");
var {
  jsonResponse: response,
  publicUser,
} = require("../../../json/json.response");

// pending approve list
router.get("/pending", auth, allowRoles("admin"), async function (req, res) {
  try {
    const users = await User.find({ isApprove: false }).select("-password");
    return response(res, 200, "success", users.map(publicUser));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// approve user
router.put(
  "/:id/approve",
  auth,
  allowRoles("admin"),
  async function (req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return response(res, 400, "user not found", null);
      }

      user.isApprove = true;
      await user.save();

      return response(res, 200, "success", publicUser(user));
    } catch (error) {
      return response(res, 500, "unknown error", null);
    }
  },
);

module.exports = router;
