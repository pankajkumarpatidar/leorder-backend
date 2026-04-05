const express = require("express");
const router = express.Router();

const controller = require("../controllers/commissionController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/my", verifyToken, controller.myCommission);
router.get("/total", verifyToken, controller.totalCommission);

module.exports = router;
