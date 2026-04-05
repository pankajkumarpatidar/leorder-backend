const express = require("express");
const router = express.Router();

const controller = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, controller.create);
router.get("/", verifyToken, controller.list);
router.put("/approve/:id", verifyToken, controller.approve);
router.get("/:id", verifyToken, controller.details);

module.exports = router;
