const router = require("express").Router();
const ctrl = require("../controllers/userBrandController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== ASSIGN BRANDS =====
// admin + staff
router.post("/assign", verifyToken, ctrl.assign);

// ===== GET USER BRANDS =====
router.get("/:user_id", verifyToken, ctrl.getUserBrands);

// ===== REMOVE SINGLE BRAND =====
// admin + staff
router.delete("/remove", verifyToken, ctrl.remove);

module.exports = router;