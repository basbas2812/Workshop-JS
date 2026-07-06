var express = require("express");
var router = express.Router();

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/products", require("./shop"));
router.use("/orders", require("./orders"));

module.exports = router;
