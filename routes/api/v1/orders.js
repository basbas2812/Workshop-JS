var express = require("express");
var router = express.Router();

var ROLES = require("../../../constants/roles");
var STATUS = require("../../../constants/status");
var Product = require("../../../models/product.model");
var Order = require("../../../models/order.model");
var auth = require("../../../middleware/jwt.decode");
var {
  jsonResponse: response,
  publicOrder,
} = require("../../../json/json.response");

router.use(auth);

// get all orders
router.get("/", async function (req, res) {
  try {
    let filter = {};

    if (req.user.role === ROLES.USER) {
      filter.userId = req.user.id;
    }

    if (req.user.role === ROLES.SHOP) {
      const products = await Product.find({
        createdBy: req.user.id,
        isActive: true,
      }).select("_id");
      filter.productId = { $in: products.map((product) => product._id) };
    } else {
      const activeProducts = await Product.find({ isActive: true }).select(
        "_id",
      );
      filter.productId = {
        ...filter.productId,
        $in: activeProducts.map((product) => product._id),
      };
    }

    const orders = await Order.find(filter)
      .populate("productId", "productName quantity price isActive")
      .populate("userId", "username role");

    if (orders.length === 0) {
      return response(res, 200, STATUS.NoMany, []);
    }

    const message = orders.length > 1 ? STATUS.Havemany : STATUS.HaveOne;
    return response(res, 200, message, orders.map(publicOrder));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

module.exports = router;
