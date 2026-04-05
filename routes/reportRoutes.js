const express = require("express");
const router = express.Router();

const report = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/summary", verifyToken, report.summary);
router.get("/brand-sales", verifyToken, report.brandSales);
router.get("/category-sales", verifyToken, report.categorySales);
router.get("/salesman", verifyToken, report.salesmanPerformance);
router.get("/monthly", verifyToken, report.monthlySales);

module.exports = router;
