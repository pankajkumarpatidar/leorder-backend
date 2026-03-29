const router = require("express").Router();
const ctrl = require("../controllers/leadController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== LIST ALL LEADS =====
router.get("/", verifyToken, ctrl.list);

// ===== CREATE LEAD =====
router.post("/", verifyToken, ctrl.create);

// ===== UPDATE STATUS =====
router.put("/status", verifyToken, ctrl.updateStatus);

module.exports = router;