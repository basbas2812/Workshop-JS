var express = require("express");
var mongoose = require("mongoose");
var router = express.Router();

var ROLES = require("../../../constants/roles");
var STATUS = require("../../../constants/status");
var Product = require("../../../models/product.model");
var Order = require("../../../models/order.model");
var auth = require("../../../middleware/jwt.decode");
var allowRoles = require("../../../middleware/role");
var {
  jsonResponse: response,
  publicProduct,
  publicOrder,
} = require("../../../json/json.response");

router.use(auth);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// get all active products
router.get("/", async function (req, res) {
  try {
    const products = await Product.find({ isActive: true }).populate(
      "createdBy",
      "username role",
    );

    if (products.length === 0) {
      return response(res, 200, STATUS.NoMany, []);
    }

    const message = products.length > 1 ? STATUS.Havemany : STATUS.HaveOne;
    return response(res, 200, message, products.map(publicProduct));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// get all orders of a product
router.get("/:id/orders", async function (req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (
      req.user.role === ROLES.SHOP &&
      String(product.createdBy) !== req.user.id
    ) {
      return response(res, 401, STATUS.NotHavePermission, null);
    }

    const orders = await Order.find({ productId: req.params.id })
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

// add order to product
router.post("/:id/orders", allowRoles(ROLES.USER), async function (req, res) {
  try {
    const { quantity } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (!quantity || quantity <= 0) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (quantity > product.quantity) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const order = await Order.create({
      productId: product._id,
      userId: req.user.id,
      quantity,
    });

    product.quantity -= quantity;
    await product.save();

    const result = await Order.findById(order._id)
      .populate("productId", "productName quantity price isActive")
      .populate("userId", "username role");

    return response(res, 201, STATUS.SaveSuccess, publicOrder(result));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// get product by id
router.get("/:id", async function (req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return response(res, 400, STATUS.NoOne, null);
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("createdBy", "username role");

    if (!product) {
      return response(res, 400, STATUS.NoOne, null);
    }

    return response(res, 200, STATUS.HaveOne, publicProduct(product));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// add product
router.post("/", allowRoles(ROLES.SHOP), async function (req, res) {
  try {
    const { productName, quantity, price } = req.body;

    if (!productName || quantity === undefined) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (quantity < 0 || price < 0) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const product = await Product.create({
      productName,
      quantity,
      price: price || 0,
      isActive: true,
      createdBy: req.user.id,
    });

    return response(res, 201, STATUS.SaveSuccess, publicProduct(product));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// update product
router.put("/:id", allowRoles(ROLES.SHOP), async function (req, res) {
  try {
    const { productName, quantity, price } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (String(product.createdBy) !== req.user.id) {
      return response(res, 401, STATUS.NotHavePermission, null);
    }

    if (quantity !== undefined && quantity < 0) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (price !== undefined && price < 0) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (productName !== undefined) product.productName = productName;
    if (quantity !== undefined) product.quantity = quantity;
    if (price !== undefined) product.price = price;

    await product.save();

    return response(res, 200, STATUS.Success, publicProduct(product));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

// soft delete product
router.delete("/:id", allowRoles(ROLES.SHOP), async function (req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return response(res, 400, STATUS.NotSuccess, null);
    }

    if (String(product.createdBy) !== req.user.id) {
      return response(res, 401, STATUS.NotHavePermission, null);
    }

    product.isActive = false;
    await product.save();

    return response(res, 200, STATUS.Success, publicProduct(product));
  } catch (error) {
    return response(res, 500, STATUS.DontKnowIssue, null);
  }
});

module.exports = router;
