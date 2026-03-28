const express = require("express");
const router = express.Router();

const user = require("../controllers/userController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// =======================
// ALL USER ROUTES PROTECTED
// =======================

// GET ALL USERS (ADMIN)
router.get(
  "/",
  verifyToken,
  checkRole("admin"),
  user.list
);

// CREATE USER (ALT ROUTE - OPTIONAL)
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  user.create
);

module.exports = router;