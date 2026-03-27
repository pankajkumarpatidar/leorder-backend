const express = require("express");
const router = express.Router();

const order = require("../controllers/order.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.post("/create", order.create);

router.get("/list", order.list);
router.get("/my", order.myOrders);
router.get("/:id", order.getOne);

router.put("/status", order.updateStatus);

module.exports = router;