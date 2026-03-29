const router = require("express").Router();
const ctrl = require("../controllers/leadController");

const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// LIST
router.get("/", verifyToken, ctrl.list);

// CREATE (salesman allowed)
router.post("/", verifyToken, ctrl.create);

// ✅ UPDATE STATUS (ONLY ADMIN / DISTRIBUTOR)
router.put(
  "/status",
  verifyToken,
  checkRole("admin", "distributor"),
  ctrl.updateStatus
);

module.exports = router;