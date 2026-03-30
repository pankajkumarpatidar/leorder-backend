const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ✅ FIXED IMPORT
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ ROUTES
router.post("/products", verifyToken, productController.create);
router.get("/products", verifyToken, productController.list);
router.put("/products/:id", verifyToken, productController.update);
router.delete("/products/:id", verifyToken, productController.remove);

module.exports = router;