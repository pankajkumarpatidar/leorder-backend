const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// =======================
// PUBLIC ROUTES
// =======================

// REGISTER (ADMIN + DISTRIBUTOR)
router.post("/register", auth.register);

// LOGIN
router.post("/login", auth.login);

// =======================
// PRIVATE ROUTES
// =======================

// CREATE USER (ONLY ADMIN)
router.post(
  "/create-user",
  verifyToken,
  checkRole("admin"),
  auth.createUser
);

module.exports = router;