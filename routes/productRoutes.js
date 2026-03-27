const express = require("express");
const router = express.Router();

const product = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, product.create);
router.put("/", verifyToken, product.update);
router.get("/", verifyToken, product.list);

router.get("/price-list/:brand_id", verifyToken, product.priceList);
router.get("/price-list-excel/:brand_id", verifyToken, product.priceListExcel);

module.exports = router;