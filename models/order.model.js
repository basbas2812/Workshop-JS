const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("order", orderSchema);
