const express = require("express");
const router = express.Router();

const order = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, order.create);
router.get("/", verifyToken, order.list);
router.get("/my", verifyToken, order.myOrders);
router.get("/:id", verifyToken, order.getOne);
router.put("/status", verifyToken, order.updateStatus);

module.exports = router;