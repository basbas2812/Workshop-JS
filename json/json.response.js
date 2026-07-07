function jsonResponse(res, status, message, data) {
  return res.status(status).json({
    status,
    message,
    data,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
  };
}

function publicProduct(product) {
  return {
    id: product._id,
    productName: product.productName,
    quantity: product.quantity,
    price: product.price,
    createdBy: product.createdBy,
  };
}

function publicOrder(order) {
  return {
    id: order._id,
    productName: order.productId?.productName,
    quantity: order.quantity,
    username: order.userId?.username,
  };
}

module.exports = { jsonResponse, publicUser, publicProduct, publicOrder };
