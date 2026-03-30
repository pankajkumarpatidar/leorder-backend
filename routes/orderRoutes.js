const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");

router.post("/orders", auth, orderController.create);

module.exports = router;