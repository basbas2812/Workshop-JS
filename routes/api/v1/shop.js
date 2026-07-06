var express = require("express");
var mongoose = require("mongoose");
var router = express.Router();

var Product = require("../../../models/product.model");
var Order = require("../../../models/order.model");
var auth = require("../../../middleware/jwt.decode");
var allowRoles = require("../../../middleware/role");
var {
  jsonResponse: response,
  publicProduct,
  publicOrder,
} = require("../../../json/json.response");

// get all active products
router.get("/", auth, async function (req, res) {
  try {
    const products = await Product.find({ isActive: true }).populate(
      "createdBy",
      "username role",
    );
    return response(res, 200, "success", products.map(publicProduct));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// get all orders of a product
router.get("/:id/orders", auth, async function (req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return response(res, 400, "product not found", null);
    }

    if (req.user.role === "shop" && String(product.createdBy) !== req.user.id) {
      return response(res, 401, "permission denied", null);
    }

    const orders = await Order.find({ productId: req.params.id })
      .populate("productId", "productName quantity price isActive")
      .populate("userId", "username role");

    return response(res, 200, "success", orders.map(publicOrder));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// add order to product
router.post("/:id/orders", auth, allowRoles("user"), async function (req, res) {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return response(res, 400, "quantity must be greater than 0", null);
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return response(res, 400, "product not found", null);
    }

    if (quantity > product.quantity) {
      return response(res, 400, "stock not enough", null);
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

    return response(res, 201, "success", publicOrder(result));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// get product by id
router.get("/:id", auth, async function (req, res) {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("createdBy", "username role");

    if (!product) {
      return response(res, 400, "product not found", null);
    }

    return response(res, 200, "success", publicProduct(product));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// add product
router.post("/", auth, allowRoles("shop"), async function (req, res) {
  try {
    const { productName, quantity, price } = req.body;

    if (!productName || quantity === undefined) {
      return response(res, 400, "productName and quantity are required", null);
    }

    if (quantity < 0 || price < 0) {
      return response(
        res,
        400,
        "quantity and price must not be negative",
        null,
      );
    }

    const product = await Product.create({
      productName,
      quantity,
      price: price || 0,
      isActive: true,
      createdBy: req.user.id,
    });

    return response(res, 201, "success", publicProduct(product));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// update product
router.put("/:id", auth, allowRoles("shop"), async function (req, res) {
  try {
    const { productName, quantity, price } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return response(res, 400, "product not found", null);
    }

    if (String(product.createdBy) !== req.user.id) {
      return response(res, 401, "permission denied", null);
    }

    if (quantity !== undefined && quantity < 0) {
      return response(res, 400, "quantity must not be negative", null);
    }

    if (price !== undefined && price < 0) {
      return response(res, 400, "price must not be negative", null);
    }

    if (productName !== undefined) product.productName = productName;
    if (quantity !== undefined) product.quantity = quantity;
    if (price !== undefined) product.price = price;

    await product.save();

    return response(res, 200, "success", publicProduct(product));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

// soft delete product
router.delete("/:id", auth, allowRoles("shop"), async function (req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return response(res, 400, "product not found", null);
    }

    if (String(product.createdBy) !== req.user.id) {
      return response(res, 401, "permission denied", null);
    }

    product.isActive = false;
    await product.save();

    return response(res, 200, "success", publicProduct(product));
  } catch (error) {
    return response(res, 500, "unknown error", null);
  }
});

module.exports = router;
