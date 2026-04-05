const express = require("express");
const router = express.Router();

const controller = require("../controllers/incentiveController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/my", verifyToken, controller.myIncentive);
router.get("/current", verifyToken, controller.current);

module.exports = router;
