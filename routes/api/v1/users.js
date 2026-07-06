var express = require("express");
var mongoose = require("mongoose");
var router = express.Router();

var ROLES = require("../../../constants/roles");
var STATUS = require("../../../constants/status");
var User = require("../../../models/user.model");
var auth = require("../../../middleware/jwt.decode");
var allowRoles = require("../../../middleware/role");
var {
  jsonResponse: response,
  publicUser,
} = require("../../../json/json.response");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// pending approve list
router.get(
  "/pending",
  auth,
  allowRoles(ROLES.ADMIN),
  async function (req, res) {
    try {
      const users = await User.find({ isApprove: false }).select("-password");

      if (users.length === 0) {
        return response(res, 200, STATUS.NoMany, []);
      }

      const message = users.length > 1 ? STATUS.Havemany : STATUS.HaveOne;
      return response(res, 200, message, users.map(publicUser));
    } catch (error) {
      return response(res, 500, STATUS.DontKnowIssue, null);
    }
  },
);

// approve user
router.put(
  "/:id/approve",
  auth,
  allowRoles(ROLES.ADMIN),
  async function (req, res) {
    try {
      if (!isValidObjectId(req.params.id)) {
        return response(res, 400, STATUS.NotSuccess, null);
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return response(res, 400, STATUS.NotSuccess, null);
      }

      user.isApprove = true;
      await user.save();

      return response(res, 200, STATUS.Success, publicUser(user));
    } catch (error) {
      return response(res, 500, STATUS.DontKnowIssue, null);
    }
  },
);

module.exports = router;
