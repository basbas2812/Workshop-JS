var express = require("express");
var router = express.Router();

var Product = require("../../../models/product.model");
var Order = require("../../../models/order.model");
var auth = require("../../../middleware/jwt.decode");
var allowRoles = require("../../../middleware/role");
var response = require("../../../json/json.response");

// get all orders
router.get("/", auth, async function (req, res) {
  try {
    let filter = {};

    if (req.user.role === "user") {
      filter.userId = req.user.id;
    }

    if (req.user.role === "shop") {
      const products = await Product.find({ createdBy: req.user.id }).select(
        "_id",
      );
      filter.productId = { $in: products.map((product) => product._id) };
    }

    const orders = await Order.find(filter)
      .populate("productId", "productName quantity price isActive")
      .populate("userId", "username role");

    return response(res, 200, "success", orders);
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

module.exports = router;
