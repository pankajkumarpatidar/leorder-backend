const express = require("express");
const router = express.Router();

const leadController = require("../controllers/leadController");

const {
  verifyToken,
  checkRole,
} = require("../middleware/authMiddleware");


// ================= CREATE LEAD =================
router.post(
  "/",
  verifyToken,
  checkRole("admin", "staff", "salesman"),
  leadController.create
);


// ================= GET ALL LEADS =================
router.get(
  "/",
  verifyToken,
  leadController.list
);


// ================= APPROVE LEAD =================
router.put(
  "/approve/:id",
  verifyToken,
  checkRole("admin", "staff"),
  leadController.approve
);


// ================= DELETE LEAD =================
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin", "staff"),
  leadController.remove
);


module.exports = router;
