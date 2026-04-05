const express = require("express");
const router = express.Router();

const controller = require("../controllers/leadController");
const { verifyToken } = require("../middleware/authMiddleware");

// BASE: /api/leads

router.post("/", verifyToken, controller.create);
router.get("/", verifyToken, controller.list);
router.put("/approve/:id", verifyToken, controller.approve);
router.delete("/:id", verifyToken, controller.remove);

module.exports = router;
