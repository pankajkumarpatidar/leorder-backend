const express = require("express");
const router = express.Router();

const product = require("../controllers/product.controller");
const { verifyToken, checkRole } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", checkRole("admin"), product.create);
router.put("/update", checkRole("admin"), product.update);

router.get("/list", product.list);
router.get("/price-list/:brand_id", product.priceList);
router.get("/price-list-excel/:brand_id", product.priceListExcel);

module.exports = router;