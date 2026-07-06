require("dotenv").config();

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const ROLES = require("../constants/roles");
const User = require("../models/user.model");

async function main() {
  await mongoose.connect(
    `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const exists = await User.findOne({ username });
  if (exists) {
    console.log("Admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    username,
    password: hashedPassword,
    role: ROLES.ADMIN,
    isApprove: true,
  });

  console.log(`Admin created: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
