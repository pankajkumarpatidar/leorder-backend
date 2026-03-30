const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// ✅ FIXED IMPORT
const { verifyToken } = require("../middleware/authMiddleware");

// ===== CREATE =====
router.post("/orders", verifyToken, orderController.create);

// ===== LIST =====
router.get("/orders", verifyToken, orderController.list);

// ===== DETAILS =====
router.get("/orders/:id", verifyToken, orderController.details);

module.exports = router;