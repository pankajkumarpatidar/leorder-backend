const express = require("express");
const router = express.Router();

const product = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, product.create);
router.get("/", verifyToken, product.list);
router.put("/:id", verifyToken, product.update);
router.delete("/:id", verifyToken, product.remove);

module.exports = router;
