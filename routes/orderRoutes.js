const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");

// CREATE
router.post("/orders", auth, orderController.create);

// LIST
router.get("/orders", auth, orderController.list);

// DETAILS
router.get("/orders/:id", auth, orderController.details);

module.exports = router;