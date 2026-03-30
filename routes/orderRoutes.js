const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== ORDER ROUTES =====

// CREATE ORDER
router.post("/orders", verifyToken, orderController.create);

// LIST ORDERS (with filters support)
router.get("/orders", verifyToken, orderController.list);

// ORDER DETAILS
router.get("/orders/:id", verifyToken, orderController.details);

module.exports = router;