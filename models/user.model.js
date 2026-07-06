const ROLES = require("../constants/roles");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    isApprove: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("user", userSchema);
